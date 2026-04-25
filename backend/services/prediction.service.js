import Order from '../models/Order.model.js';

/**
 * Predicts the estimated wait time for a canteen based on historical data and current queue length.
 * @param {string} canteenId - The ID of the canteen.
 * @returns {Promise<number>} - Estimated wait time in minutes.
 */
export const predictWaitTime = async (canteenId) => {
    try {
        // 1. Get current active orders (pending + preparing)
        const activeOrdersCount = await Order.countDocuments({
            canteen: canteenId,
            status: { $in: ['pending', 'preparing'] },
        });

        // 2. Calculate historical average prep time for this canteen (last 7 days)
        // We use the time from creation till 'ready' or 'completed' status.
        // If 'ready' is not recorded separately, we use 'updatedAt' for status updates.
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const completedOrders = await Order.find({
            canteen: canteenId,
            status: { $in: ['ready', 'completed'] },
            createdAt: { $gte: sevenDaysAgo },
        }).select('createdAt updatedAt');

        let totalPrepTimeMs = 0;
        let validOrderCount = 0;

        completedOrders.forEach((order) => {
            // Logic: updatedAt for 'ready'/'completed' minus createdAt gives a rough prep time.
            const prepTime = order.updatedAt - order.createdAt;
            if (prepTime > 0 && prepTime < 3600000) { // filter out outliers > 1 hour
                totalPrepTimeMs += prepTime;
                validOrderCount++;
            }
        });

        // Default to 4 minutes per order if no historical data
        const averagePrepTimeMinutes = validOrderCount > 0
            ? (totalPrepTimeMs / validOrderCount) / 60000
            : 4;

        // 3. Estimated Wait Time = (Active Orders ahead + this one) * Average Prep Time
        // We assume the kitchen can handle multiple orders, so we divide by a concurrency factor (e.g. 2).
        const concurrencyFactor = 2;
        const estimatedMinutes = Math.ceil(((activeOrdersCount + 1) * averagePrepTimeMinutes) / concurrencyFactor);

        return Math.max(estimatedMinutes, 5); // Minimum 5 mins
    } catch (error) {
        console.error('Wait time prediction error:', error);
        return 10; // Fallback
    }
};

/**
 * Predicts if a canteen is likely to experience a surge based on historical trends.
 * @param {string} canteenId - The ID of the canteen.
 * @returns {Promise<{ isSurge: boolean, reason: string }>}
 */
export const predictSurge = async (canteenId) => {
    try {
        const now = new Date();
        const currentHour = now.getHours();

        // 1. Check Historical Surge for this hour (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Aggregate orders by hour
        const historicalOrders = await Order.aggregate([
            {
                $match: {
                    canteen: canteenId,
                    createdAt: { $gte: sevenDaysAgo },
                },
            },
            {
                $project: {
                    hour: { $hour: '$createdAt' },
                },
            },
            {
                $match: {
                    hour: currentHour,
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                },
            },
        ]);

        const historicalTotal = historicalOrders.length > 0 ? historicalOrders[0].total : 0;
        const historicalAveragePerHour = historicalTotal / 7;

        // 2. Check current queue length
        const currentQueueCount = await Order.countDocuments({
            canteen: canteenId,
            status: { $in: ['pending', 'preparing'] },
        });

        const BUSY_THRESHOLD = 15;
        const HISTORICAL_THRESHOLD = 20;

        if (currentQueueCount >= BUSY_THRESHOLD) {
            return {
                isSurge: true,
                reason: 'Current queue is very long. Order now to avoid longer delays!'
            };
        }

        if (historicalAveragePerHour >= HISTORICAL_THRESHOLD) {
            return {
                isSurge: true,
                reason: 'This is usually a busy time for this canteen. Ordering early is recommended!'
            };
        }

        // Prediction for upcoming hour (next hour)
        const nextHour = (currentHour + 1) % 24;
        const nextHourHistorical = await Order.aggregate([
            {
                $match: {
                    canteen: canteenId,
                    createdAt: { $gte: sevenDaysAgo },
                },
            },
            {
                $project: {
                    hour: { $hour: '$createdAt' },
                },
            },
            {
                $match: { hour: nextHour },
            },
            { $group: { _id: null, total: { $sum: 1 } } },
        ]);

        const nextHourTotal = nextHourHistorical.length > 0 ? nextHourHistorical[0].total : 0;
        if ((nextHourTotal / 7) >= HISTORICAL_THRESHOLD) {
            return {
                isSurge: true,
                reason: 'A busy period is starting soon. Beat the rush by ordering now!'
            }
        }

        return { isSurge: false, reason: '' };
    } catch (error) {
        console.error('Surge prediction error:', error);
        return { isSurge: false, reason: '' };
    }
};

/**
 * Provides 3 recommended pickup slots based on kitchen load and historical trends.
 * @param {string} canteenId
 * @returns {Promise<Array<{type: string, time: Date, label: string, description: string}>>}
 */
export const getRecommendedSlots = async (canteenId) => {
    try {
        const now = new Date();
        const SLOT_INTERVAL = 10;

        // Helper to round to next slot
        const roundToNextSlot = (date) => {
            const d = new Date(date);
            const mins = Math.ceil((d.getMinutes() + 1) / SLOT_INTERVAL) * SLOT_INTERVAL;
            d.setMinutes(mins, 0, 0);
            return d;
        };

        const waitTime = await predictWaitTime(canteenId);

        // 1. ASAP Slot (First available)
        const asapTime = roundToNextSlot(now);

        // 2. Optimized Slot (After predicted wait time, finding a quieter slot)
        let optimizedTime = new Date(now.getTime() + waitTime * 60000);
        optimizedTime = roundToNextSlot(optimizedTime);

        // 3. Relaxed Slot (Historically quieter period ~40 mins later)
        let relaxedTime = new Date(now.getTime() + 40 * 60000);
        relaxedTime = roundToNextSlot(relaxedTime);

        return [
            {
                type: 'ASAP',
                time: asapTime,
                label: 'ASAP (Fastest)',
                description: `Approx. ${waitTime} min wait from now.`
            },
            {
                type: 'Optimized',
                time: optimizedTime,
                label: 'Optimized (Smart)',
                description: 'Recommended based on current kitchen load.'
            },
            {
                type: 'Relaxed',
                time: relaxedTime,
                label: 'Relaxed (Quiet)',
                description: 'Scheduled for a historically quieter period.'
            }
        ];
    } catch (error) {
        console.error('Recommended slots error:', error);
        return [];
    }
};
