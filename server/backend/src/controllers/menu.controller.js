const prisma = require('../lib/prisma');

exports.getMenu = async (req, res) => {
  try {
    const itemsResult = await prisma.menuItem.findMany({
      where: { restaurant_id: req.params.id },
      include: {
        options: { include: { choices: true } },
        variants: { include: { items: true } }
      }
    });

    const items = itemsResult.map(item => {
      const menuItem = {
        id: item.id, name: item.name,
        price: parseFloat(item.price),
        image: item.image, description: item.description
      };
      if (item.options && item.options.length > 0) {
        menuItem.options = item.options.map(opt => ({
          id: opt.option_id, name: opt.name,
          required: opt.required, multiSelect: opt.multi_select,
          choices: opt.choices.map(c => ({
            id: c.choice_id, name: c.name,
            priceModifier: parseFloat(c.price_modifier)
          }))
        }));
      }
      if (item.variants && item.variants.length > 0) {
        const v = item.variants[0];
        menuItem.variants = {
          required: v.required,
          items: v.items.map(vi => ({
            id: vi.item_id, name: vi.name, price: parseFloat(vi.price)
          }))
        };
      }
      return menuItem;
    });

    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
