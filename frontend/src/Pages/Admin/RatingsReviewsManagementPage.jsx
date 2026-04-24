import React, { useState, useEffect, useMemo } from 'react';
import { 
  Star, TrendingUp, TrendingDown, MessageSquare, AlertCircle, Trash2, Flag,
  ThumbsUp, ThumbsDown, CheckCircle, Search, Filter
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { toast } from 'react-toastify';
import api, { reviewAPI } from '../../services/api';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
const SENTIMENT_COLORS = { positive: '#10b981', neutral: '#9ca3af', negative: '#ef4444' };

const RatingsReviewsManagementPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('current');
  const [filterCanteen, setFilterCanteen] = useState('all');
  const [filterMeal, setFilterMeal] = useState('all');
  const [filterRating, setFilterRating] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await reviewAPI.getAll();
      setReviews(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await api.delete(`/api/reviews/${id}`);
      setReviews(prev => prev.filter(r => r._id !== id));
      toast.success('Review deleted');
    } catch (err) {
      toast.error('Failed to delete review');
    }
  };

  const handleFlag = (id) => {
    toast.info('Review flagged for administrative review.');
  };

  // ─── Data Processing ────────────────────────────────────────────────────────
  const processedData = useMemo(() => {
    if (!reviews.length) return null;

    const ratedReviews = reviews.filter(r => r.rating);
    let totalRating = 0;
    const canteenStats = {};
    const mealStats = {};
    const ratingDist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let positive = 0, negative = 0, neutral = 0;

    reviews.forEach(r => {
      const rating = r.rating || 0;
      if (rating) {
        totalRating += rating;
        ratingDist[Math.round(rating)] = (ratingDist[Math.round(rating)] || 0) + 1;
        
        if (rating >= 4) positive++;
        else if (rating <= 2) negative++;
        else neutral++;
      }

      // Only include in canteen stats if canteen is actually populated
      const canteenName = r.canteenId?.name;
      if (canteenName && rating) {
        if (!canteenStats[canteenName]) canteenStats[canteenName] = { name: canteenName, sum: 0, count: 0, negative: 0 };
        canteenStats[canteenName].sum += rating;
        canteenStats[canteenName].count++;
        if (rating <= 2) canteenStats[canteenName].negative++;
      }

      // Only include in meal stats if food item is actually populated
      const mealName = r.foodId?.name;
      if (mealName && rating) {
        if (!mealStats[mealName]) mealStats[mealName] = { name: mealName, sum: 0, count: 0 };
        mealStats[mealName].sum += rating;
        mealStats[mealName].count++;
      }
    });

    const avgOverall = ratedReviews.length > 0 ? totalRating / ratedReviews.length : 0;

    const canteensArray = Object.values(canteenStats).map(c => ({
      ...c,
      avg: c.count > 0 ? c.sum / c.count : 0,
      negPercentage: c.count > 0 ? (c.negative / c.count) * 100 : 0
    }));

    const mealsArray = Object.values(mealStats).map(m => ({
      ...m,
      avg: m.count > 0 ? m.sum / m.count : 0
    }));

    canteensArray.sort((a, b) => b.avg - a.avg);
    mealsArray.sort((a, b) => b.avg - a.avg);

    // ── Sentiment: combined rating + comment text analysis ──
    const POSITIVE_WORDS = ['great','good','excellent','amazing','awesome','delicious','tasty','love','loved','best','fresh','nice','wonderful','perfect','fantastic','superb','yummy','recommend','happy','satisfied','clean','friendly','fast','quick','hot','warm'];
    const NEGATIVE_WORDS = ['bad','terrible','worst','awful','disgusting','cold','stale','slow','rude','dirty','overpriced','expensive','bland','tasteless','horrible','poor','late','raw','undercooked','unhygienic','disappointed','waste','never','hate','gross'];

    let sentimentPositive = 0, sentimentNeutral = 0, sentimentNegative = 0;
    const sentimentDetails = { positiveKeywords: {}, negativeKeywords: {} };

    reviews.forEach(r => {
      let score = 0;
      const rating = r.rating || 0;
      const comment = (r.comment || '').toLowerCase();

      // Rating-based score
      if (rating >= 4) score += 2;
      else if (rating === 3) score += 0;
      else if (rating >= 1) score -= 2;

      // Comment keyword-based score
      if (comment) {
        POSITIVE_WORDS.forEach(w => {
          if (comment.includes(w)) {
            score += 1;
            sentimentDetails.positiveKeywords[w] = (sentimentDetails.positiveKeywords[w] || 0) + 1;
          }
        });
        NEGATIVE_WORDS.forEach(w => {
          if (comment.includes(w)) {
            score -= 1;
            sentimentDetails.negativeKeywords[w] = (sentimentDetails.negativeKeywords[w] || 0) + 1;
          }
        });
      }

      if (score > 0) sentimentPositive++;
      else if (score < 0) sentimentNegative++;
      else sentimentNeutral++;
    });

    const totalSentimentCount = reviews.length || 1;
    const topPositiveWords = Object.entries(sentimentDetails.positiveKeywords)
      .sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topNegativeWords = Object.entries(sentimentDetails.negativeKeywords)
      .sort((a, b) => b[1] - a[1]).slice(0, 5);

    return {
      avgOverall: avgOverall.toFixed(1),
      totalReviews: reviews.length,
      topCanteen: canteensArray.length > 0 ? canteensArray[0] : null,
      topMeal: mealsArray.length > 0 ? mealsArray[0] : null,
      worstMeal: mealsArray.length > 0 ? mealsArray[mealsArray.length - 1] : null,
      ratingData: [
        { name: '5 Stars', value: ratingDist[5] },
        { name: '4 Stars', value: ratingDist[4] },
        { name: '3 Stars', value: ratingDist[3] },
        { name: '2 Stars', value: ratingDist[2] },
        { name: '1 Star', value: ratingDist[1] },
      ],
      sentiment: {
        positive: ((sentimentPositive / totalSentimentCount) * 100).toFixed(1),
        positiveCount: sentimentPositive,
        neutral: ((sentimentNeutral / totalSentimentCount) * 100).toFixed(1),
        neutralCount: sentimentNeutral,
        negative: ((sentimentNegative / totalSentimentCount) * 100).toFixed(1),
        negativeCount: sentimentNegative,
        topPositiveWords,
        topNegativeWords,
      },
      canteensArray,
      mealsArray,
      top5Meals: mealsArray.slice(0, 5),
      worst5Meals: mealsArray.slice().reverse().slice(0, 5),
      popularMeals: [...mealsArray].sort((a, b) => b.count - a.count).slice(0, 5)
    };
  }, [reviews]);

  // ─── Monthly Data (computed from real reviews) ──────────────────────────────
  const monthlyAnalysis = useMemo(() => {
    if (!reviews.length) return null;

    const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    // Group reviews by year-month
    const monthBuckets = {};
    const thisMonthReviews = [];
    const lastMonthReviews = [];

    // Meal stats for current month
    const thisMonthMealStats = {};

    reviews.forEach(r => {
      const d = new Date(r.createdAt);
      const m = d.getMonth();
      const y = d.getFullYear();
      const key = `${y}-${String(m).padStart(2, '0')}`;
      const rating = r.rating || 0;

      if (!monthBuckets[key]) monthBuckets[key] = { sum: 0, count: 0, year: y, month: m };
      if (rating) {
        monthBuckets[key].sum += rating;
        monthBuckets[key].count++;
      }

      // This month
      if (m === thisMonth && y === thisYear && rating) {
        thisMonthReviews.push(r);
        const mealName = r.foodId?.name;
        if (mealName) {
          if (!thisMonthMealStats[mealName]) thisMonthMealStats[mealName] = { name: mealName, sum: 0, count: 0 };
          thisMonthMealStats[mealName].sum += rating;
          thisMonthMealStats[mealName].count++;
        }
      }

      // Last month
      const lastMonthIdx = thisMonth === 0 ? 11 : thisMonth - 1;
      const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
      if (m === lastMonthIdx && y === lastMonthYear && rating) {
        lastMonthReviews.push(r);
      }
    });

    // Build sorted monthly trend (last 6 months)
    const trendData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(thisYear, thisMonth - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
      const bucket = monthBuckets[key];
      trendData.push({
        month: MONTH_NAMES[date.getMonth()],
        avg: bucket && bucket.count > 0 ? parseFloat((bucket.sum / bucket.count).toFixed(2)) : 0,
        count: bucket?.count || 0
      });
    }

    // This month vs last month
    const thisMonthAvg = thisMonthReviews.length > 0
      ? thisMonthReviews.reduce((s, r) => s + r.rating, 0) / thisMonthReviews.length
      : 0;
    const lastMonthAvg = lastMonthReviews.length > 0
      ? lastMonthReviews.reduce((s, r) => s + r.rating, 0) / lastMonthReviews.length
      : 0;
    const percentChange = lastMonthAvg > 0
      ? (((thisMonthAvg - lastMonthAvg) / lastMonthAvg) * 100)
      : 0;

    // Monthly top & worst meals
    const monthMealsArray = Object.values(thisMonthMealStats).map(m => ({
      ...m,
      avg: m.count > 0 ? m.sum / m.count : 0
    }));
    monthMealsArray.sort((a, b) => b.avg - a.avg);

    return {
      trendData,
      thisMonthAvg: thisMonthAvg.toFixed(1),
      lastMonthAvg: lastMonthAvg.toFixed(1),
      percentChange: percentChange.toFixed(1),
      isPositiveChange: percentChange >= 0,
      thisMonthCount: thisMonthReviews.length,
      lastMonthCount: lastMonthReviews.length,
      monthlyTopMeals: monthMealsArray.slice(0, 5),
      monthlyWorstMeals: monthMealsArray.slice().reverse().slice(0, 5),
    };
  }, [reviews]);

  const filteredReviews = reviews.filter(r => {
    const matchCanteen = filterCanteen === 'all' || r.canteenId?._id === filterCanteen;
    const matchMeal = filterMeal === 'all' || r.foodId?._id === filterMeal;
    const matchRating = filterRating === 'all' || Math.round(r.rating || 0).toString() === filterRating;
    const matchSearch = r.comment?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        r.foodId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        r.canteenId?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCanteen && matchMeal && matchRating && matchSearch;
  });

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-gray-500">Loading insights...</div>;
  }

  if (!processedData) {
    return <div className="p-6 text-gray-500">No reviews found yet.</div>;
  }

  // Extract unique lists for filters
  const uniqueCanteens = [...new Set(reviews.map(r => r.canteenId?._id).filter(Boolean))].map(id => {
    return reviews.find(r => r.canteenId?._id === id)?.canteenId;
  });
  const uniqueMeals = [...new Set(reviews.map(r => r.foodId?._id).filter(Boolean))].map(id => {
    return reviews.find(r => r.foodId?._id === id)?.foodId;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-2 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Ratings & Reviews</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor user feedback and analyze canteen performance.</p>
        </div>
      </div>

      {/* ─── Top Section: Overview Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] p-5 border border-slate-100/50">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Avg</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-800">{processedData.avgOverall}</span>
            <Star className="text-yellow-400 fill-yellow-400" size={24} />
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] p-5 border border-slate-100/50">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Top Canteen</p>
          {processedData.topCanteen ? (
            <>
              <p className="text-lg font-bold text-slate-800 mt-2 truncate" title={processedData.topCanteen.name}>{processedData.topCanteen.name}</p>
              <p className="text-sm text-emerald-600 font-semibold mt-0.5">{processedData.topCanteen.avg.toFixed(1)} ★</p>
            </>
          ) : (
            <p className="text-sm text-slate-400 mt-2">No canteen data yet</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] p-5 border border-slate-100/50">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Top Meal</p>
          {processedData.topMeal ? (
            <>
              <p className="text-lg font-bold text-slate-800 mt-2 truncate" title={processedData.topMeal.name}>{processedData.topMeal.name}</p>
              <p className="text-sm text-emerald-600 font-semibold mt-0.5">{processedData.topMeal.avg.toFixed(1)} ★</p>
            </>
          ) : (
            <p className="text-sm text-slate-400 mt-2">No meal data yet</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] p-5 border border-slate-100/50">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Reviews</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-800">{processedData.totalReviews}</span>
            <MessageSquare className="text-slate-300" size={24} />
          </div>
        </div>
      </div>

      {/* ─── Main Section: Tabs ────────────────────────────────────────────── */}
      <div className="bg-slate-100/50 p-1.5 rounded-2xl inline-flex gap-1">
        <button 
          onClick={() => setActiveTab('current')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'current' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Current Analysis
        </button>
        <button 
          onClick={() => setActiveTab('monthly')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Monthly Analysis
        </button>
      </div>

      {activeTab === 'current' ? (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Avg Rating per Canteen */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-base font-bold text-slate-800 mb-6">Average Rating per Canteen</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={processedData.canteensArray.slice(0, 8)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 5]} tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="avg" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Rating Distribution & Sentiment */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-base font-bold text-slate-800 mb-2">Rating Distribution</h3>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={processedData.ratingData} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                        {processedData.ratingData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-base font-bold text-slate-800 mb-4">Sentiment Overview</h3>
                <div className="flex flex-col gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2"><ThumbsUp size={16} className="text-emerald-500"/> <span className="text-sm font-medium">Positive</span></div>
                      <span className="text-xs text-slate-500">{processedData.sentiment.positiveCount} reviews</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                      <div className="bg-emerald-500 h-2.5 rounded-full transition-all" style={{width: `${processedData.sentiment.positive}%`}}></div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 mt-0.5 inline-block">{processedData.sentiment.positive}%</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2"><MessageSquare size={16} className="text-gray-400"/> <span className="text-sm font-medium">Neutral</span></div>
                      <span className="text-xs text-slate-500">{processedData.sentiment.neutralCount} reviews</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                      <div className="bg-gray-400 h-2.5 rounded-full transition-all" style={{width: `${processedData.sentiment.neutral}%`}}></div>
                    </div>
                    <span className="text-xs font-bold text-gray-500 mt-0.5 inline-block">{processedData.sentiment.neutral}%</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2"><ThumbsDown size={16} className="text-red-500"/> <span className="text-sm font-medium">Negative</span></div>
                      <span className="text-xs text-slate-500">{processedData.sentiment.negativeCount} reviews</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                      <div className="bg-red-500 h-2.5 rounded-full transition-all" style={{width: `${processedData.sentiment.negative}%`}}></div>
                    </div>
                    <span className="text-xs font-bold text-red-500 mt-0.5 inline-block">{processedData.sentiment.negative}%</span>
                  </div>
                </div>
                {(processedData.sentiment.topPositiveWords.length > 0 || processedData.sentiment.topNegativeWords.length > 0) && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Top Keywords</p>
                    <div className="flex flex-wrap gap-1.5">
                      {processedData.sentiment.topPositiveWords.map(([word, count]) => (
                        <span key={word} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                          {word} ({count})
                        </span>
                      ))}
                      {processedData.sentiment.topNegativeWords.map(([word, count]) => (
                        <span key={word} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">
                          {word} ({count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Top 5 Meals</h3>
              <div className="space-y-4">
                {processedData.top5Meals.map((m, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-700 truncate pr-2">{m.name}</span>
                    <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{m.avg.toFixed(1)} ★</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Worst 5 Meals</h3>
              <div className="space-y-4">
                {processedData.worst5Meals.map((m, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-700 truncate pr-2">{m.name}</span>
                    <span className="text-sm font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md">{m.avg.toFixed(1)} ★</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Most Popular Meals</h3>
              <div className="space-y-4">
                {processedData.popularMeals.map((m, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-700 truncate pr-2">{m.name}</span>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{m.count} reviews</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {!monthlyAnalysis ? (
            <div className="bg-white rounded-3xl p-12 shadow-sm border border-slate-100 text-center text-slate-500">
              <p className="font-semibold">Not enough data for monthly analysis yet.</p>
              <p className="text-sm mt-1">Reviews will appear here once users start submitting feedback.</p>
            </div>
          ) : (
            <>
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                  <h3 className="text-base font-bold text-slate-800 mb-6">Monthly Rating Trends (Last 6 Months)</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyAnalysis.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="month" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 5]} tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                        <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(value, name) => [value, name === 'avg' ? 'Avg Rating' : name]} />
                        <Line type="monotone" dataKey="avg" stroke="#f59e0b" strokeWidth={3} dot={{r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff'}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <h3 className="text-base font-bold text-slate-800 mb-4">Month vs Month</h3>
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-50">
                      <div>
                        <span className="text-sm text-slate-500">This Month</span>
                        <p className="text-xs text-slate-400">{monthlyAnalysis.thisMonthCount} reviews</p>
                      </div>
                      <span className="text-2xl font-bold text-slate-800">{monthlyAnalysis.thisMonthAvg} ★</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-slate-500">Last Month</span>
                        <p className="text-xs text-slate-400">{monthlyAnalysis.lastMonthCount} reviews</p>
                      </div>
                      <span className="text-xl font-bold text-slate-600">{monthlyAnalysis.lastMonthAvg} ★</span>
                    </div>
                    {(Number(monthlyAnalysis.thisMonthAvg) > 0 || Number(monthlyAnalysis.lastMonthAvg) > 0) && (
                      <div className={`mt-4 flex items-center gap-2 px-3 py-2 rounded-xl w-max ${monthlyAnalysis.isPositiveChange ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                        {monthlyAnalysis.isPositiveChange ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        <span className="text-sm font-bold">
                          {monthlyAnalysis.isPositiveChange ? '+' : ''}{monthlyAnalysis.percentChange}% {monthlyAnalysis.isPositiveChange ? 'Increase' : 'Decrease'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Monthly Meal Performance */}
              {monthlyAnalysis.monthlyTopMeals.length > 0 && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">This Month's Top Meals</h3>
                    <div className="space-y-4">
                      {monthlyAnalysis.monthlyTopMeals.map((m, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-slate-700 truncate pr-2">{m.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">{m.count} reviews</span>
                            <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{m.avg.toFixed(1)} ★</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">This Month's Worst Meals</h3>
                    <div className="space-y-4">
                      {monthlyAnalysis.monthlyWorstMeals.map((m, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-slate-700 truncate pr-2">{m.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">{m.count} reviews</span>
                            <span className="text-sm font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md">{m.avg.toFixed(1)} ★</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 overflow-hidden">
                <h3 className="text-base font-bold text-slate-800 mb-4">Canteen Performance Overview</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50/50 text-slate-500 font-semibold">
                      <tr>
                        <th className="px-4 py-3 rounded-l-xl">Canteen Name</th>
                        <th className="px-4 py-3">Avg Rating</th>
                        <th className="px-4 py-3">Review Count</th>
                        <th className="px-4 py-3">Negative Feedback</th>
                        <th className="px-4 py-3 rounded-r-xl">Trend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {processedData.canteensArray.map((c, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-800">{c.name}</td>
                          <td className="px-4 py-3 font-bold text-emerald-600">{c.avg.toFixed(1)} ★</td>
                          <td className="px-4 py-3 text-slate-600">{c.count}</td>
                          <td className="px-4 py-3 text-red-500">{c.negPercentage.toFixed(0)}%</td>
                          <td className="px-4 py-3">
                            {c.avg > 3.5 ? <TrendingUp size={16} className="text-emerald-500" /> : <TrendingDown size={16} className="text-red-500" />}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── Bottom Section: Review Management Table ───────────────────────── */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mt-8">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-slate-800">Review Management</h3>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search reviews..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all w-64 outline-none"
              />
            </div>
            <select value={filterCanteen} onChange={e => setFilterCanteen(e.target.value)} className="px-3 py-2 bg-slate-50 rounded-xl text-sm outline-none font-medium text-slate-600">
              <option value="all">All Canteens</option>
              {uniqueCanteens.map(c => c && <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <select value={filterMeal} onChange={e => setFilterMeal(e.target.value)} className="px-3 py-2 bg-slate-50 rounded-xl text-sm outline-none font-medium text-slate-600 max-w-[150px] truncate">
              <option value="all">All Meals</option>
              {uniqueMeals.map(m => m && <option key={m._id} value={m._id}>{m.name}</option>)}
            </select>
            <select value={filterRating} onChange={e => setFilterRating(e.target.value)} className="px-3 py-2 bg-slate-50 rounded-xl text-sm outline-none font-medium text-slate-600">
              <option value="all">All Ratings</option>
              {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Stars</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">Review</th>
                <th className="px-6 py-4">Rating</th>
                <th className="px-6 py-4">Meal</th>
                <th className="px-6 py-4">Canteen</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReviews.map((review) => (
                <tr key={review._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 max-w-md">
                    <p className="text-slate-800 font-medium truncate">{review.comment || <span className="text-slate-400 italic">No comment provided</span>}</p>
                    <p className="text-xs text-slate-500 mt-1">{review.userId?.name || 'Anonymous User'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 bg-yellow-50 text-yellow-600 px-2 py-1 rounded-lg w-max font-bold">
                      {review.rating} <Star size={12} className="fill-yellow-600" />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{review.foodId?.name || '-'}</td>
                  <td className="px-6 py-4 text-slate-600">{review.canteenId?.name || '-'}</td>
                  <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleFlag(review._id)} className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors" title="Flag Review">
                        <Flag size={16} />
                      </button>
                      <button onClick={() => handleDelete(review._id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete Review">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredReviews.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    <AlertCircle size={32} className="mx-auto mb-3 text-slate-300" />
                    <p className="font-semibold text-slate-600">No reviews found</p>
                    <p className="text-sm mt-1">Try adjusting your filters or search query.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RatingsReviewsManagementPage;
