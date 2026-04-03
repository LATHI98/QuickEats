const normalizeMenuItems = (responseData) => {
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.data)) return responseData.data;
  return [];
};

export const reorderOrderToCart = async ({ order, cartAPI, canteenAPI }) => {
  if (!order?.items?.length) {
    throw new Error('This order has no items to reorder.');
  }

  const canteenId = order.canteen?._id || order.canteen;
  if (!canteenId) {
    throw new Error('Unable to determine the canteen for this order.');
  }

  const menuRes = await canteenAPI.getMenu(canteenId);
  const menuItems = normalizeMenuItems(menuRes.data);
  const menuById = new Map(menuItems.map((item) => [String(item._id), item]));

  const reorderableItems = [];
  const skippedItems = [];

  for (const item of order.items) {
    const menuItemId = String(item.menuItem?._id || item.menuItem);
    const liveMenuItem = menuById.get(menuItemId);

    if (!liveMenuItem || liveMenuItem.isAvailable === false) {
      skippedItems.push(item.name || 'Unknown item');
      continue;
    }

    reorderableItems.push({
      menuItemId,
      quantity: Number(item.quantity) || 1,
    });
  }

  if (reorderableItems.length === 0) {
    throw new Error('None of the items from this order are available right now.');
  }

  await cartAPI.clearCart();

  for (const item of reorderableItems) {
    await cartAPI.addItem(item.menuItemId, item.quantity);
  }

  return {
    canteenId,
    addedCount: reorderableItems.length,
    skippedItems,
  };
};