const prisma = require('../lib/prisma');

exports.create = async (req, res) => {
  try {
    const { items, total, restaurantId, restaurantName, userId, paymentMethod, deliveryCode } = req.body;
    if (userId !== req.userId) return res.status(403).json({ error: 'No autorizado' });

    const orderId = `ord_${Date.now()}`;
    const createdAt = new Date();

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: { 
          id: orderId, 
          user_id: userId, 
          restaurant_id: restaurantId, 
          restaurant_name: restaurantName, 
          total,
          payment_method: paymentMethod || 'card',
          delivery_code: deliveryCode || null,
          created_at: createdAt 
        }
      });

      for (const item of items) {
        const orderItemId = `${orderId}_${item.id}`;
        await tx.orderItem.create({
          data: {
            id: orderItemId, 
            order_id: orderId, 
            item_id: item.id,
            name: item.name, 
            base_name: item.baseName || item.name,
            price: item.price, 
            base_price: item.basePrice || item.price,
            quantity: item.quantity,
            variant: item.variant ? JSON.stringify(item.variant) : null,
            image: item.image || null
          }
        });
        if (item.options && item.options.length > 0) {
          for (const opt of item.options) {
            await tx.orderItemOption.create({
              data: {
                order_item_id: orderItemId,
                choice_id: opt.choiceId, 
                choice_name: opt.choiceName,
                price_modifier: opt.priceModifier || 0
              }
            });
          }
        }
      }

      await tx.user.update({ 
        where: { user: userId }, 
        data: { orders_count: { increment: 1 } } 
      });

      for (const item of items) {
        if (!item.id) continue;
        const qty = item.quantity || 1;
        await tx.itemStat.upsert({
          where: { 
            restaurant_id_item_key: { 
              restaurant_id: restaurantId, 
              item_key: item.id 
            } 
          },
          update: { count: { increment: qty } },
          create: { 
            restaurant_id: restaurantId, 
            item_key: item.id, 
            count: qty 
          }
        });
        if (item.variant && item.variant.variantId) {
          const vKey = `${item.id}|${item.variant.variantId}`;
          await tx.itemStat.upsert({
            where: { 
              restaurant_id_item_key: { 
                restaurant_id: restaurantId, 
                item_key: vKey 
              } 
            },
            update: { count: { increment: qty } },
            create: { 
              restaurant_id: restaurantId, 
              item_key: vKey, 
              count: qty 
            }
          });
        }
      }

      return newOrder;
    });

    res.json({ 
      id: orderId, 
      userId, 
      restaurantId, 
      restaurantName, 
      items, 
      total, 
      paymentMethod: paymentMethod || 'card',
      deliveryCode: deliveryCode || null,
      createdAt 
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getByUser = async (req, res) => {
  try {
    if (req.params.userId !== req.userId) return res.status(403).json({ error: 'No autorizado' });
    
    const ordersResult = await prisma.order.findMany({
      where: { user_id: req.params.userId },
      orderBy: { created_at: 'desc' },
      include: { 
        items: { 
          include: { options: true } 
        } 
      }
    });
    
    const orders = ordersResult.map(o => ({
      id: o.id, 
      userId: o.user_id, 
      restaurantId: o.restaurant_id,
      restaurantName: o.restaurant_name,
      items: o.items.map(item => ({
        itemId: item.item_id, 
        name: item.name, 
        baseName: item.base_name,
        price: parseFloat(item.price), 
        basePrice: parseFloat(item.base_price),
        quantity: item.quantity, 
        variant: item.variant,
        options: item.options.map(opt => ({
          choiceId: opt.choice_id, 
          choiceName: opt.choice_name,
          priceModifier: parseFloat(opt.price_modifier)
        })),
        image: item.image
      })),
      total: parseFloat(o.total),
      paymentMethod: o.payment_method,
      deliveryCode: o.delivery_code,
      createdAt: o.created_at
    }));
    
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};