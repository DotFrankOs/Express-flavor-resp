export const mockRestaurants = [
  {
    id: 'burgers',
    name: 'Food Fast Burgers',
    type: 'burgers',
    logo: 'foot fast burgers.png',
    description: 'Especializados en hamburguesas artesanales y papas crujientes.',
    url: 'menu.html?restaurant=burgers',
    minDuration: 1,
    maxDuration: 3
  },
  {
    id: 'italian',
    name: 'Italian Taste',
    type: 'italian',
    logo: 'Italian Taste.png',
    description: 'Auténtica cocina italiana con pastas y pizzas artesanales.',
    url: 'menu.html?restaurant=italian',
    minDuration: 1,
    maxDuration: 2
  },
  {
    id: 'mexican',
    name: 'Viva México',
    type: 'mexican',
    logo: 'Viva mexico.png',
    description: 'Tacos y burritos llenos de sabor y color.',
    url: 'menu.html?restaurant=mexican',
    minDuration: 1,
    maxDuration: 2
  },
  {
    id: 'cafe',
    name: 'Café Aroma',
    type: 'cafe',
    logo: 'cafe aroma.png',
    description: 'Postres, café y un ambiente cálido para disfrutar.',
    url: 'menu.html?restaurant=cafe',
    minDuration: 1,
    maxDuration: 2
  }
];

export const mockTables = {
  burgers: {
    layout: { columns: 4, gap: '14px' },
    items: [
      { id: 1, name: 'M1', label: 'Mesa 1', style: 'standard' },
      { id: 2, name: 'M2', label: 'Mesa 2', style: 'standard' },
      { id: 3, name: 'B1', label: 'Barra 1', style: 'bar' },
      { id: 4, name: 'V1', label: 'VIP 1', style: 'vip' },
      { id: 5, name: 'T1', label: 'Terraza 1', style: 'terraza' },
      { id: 6, name: 'T2', label: 'Terraza 2', style: 'terraza' },
      { id: 7, name: 'M3', label: 'Mesa 3', style: 'standard' },
      { id: 8, name: 'M4', label: 'Mesa 4', style: 'standard' },
      { id: 9, name: 'B2', label: 'Barra 2', style: 'bar' },
      { id: 10, name: 'V2', label: 'VIP 2', style: 'vip' },
      { id: 11, name: 'M5', label: 'Mesa 5', style: 'standard' },
      { id: 12, name: 'M6', label: 'Mesa 6', style: 'standard' }
    ]
  },
  italian: {
    layout: { columns: 3, gap: '16px' },
    items: [
      { id: 1, name: 'M1', label: 'Mesa 1', style: 'standard' },
      { id: 2, name: 'M2', label: 'Mesa 2', style: 'standard' },
      { id: 3, name: 'V1', label: 'VIP 1', style: 'vip' },
      { id: 4, name: 'V2', label: 'VIP 2', style: 'vip' },
      { id: 5, name: 'T1', label: 'Terraza 1', style: 'terraza' },
      { id: 6, name: 'B1', label: 'Barra 1', style: 'bar' }
    ]
  },
  mexican: {
    layout: { columns: 3, gap: '14px' },
    items: [
      { id: 1, name: 'M1', label: 'Mesa 1', style: 'standard' },
      { id: 2, name: 'M2', label: 'Mesa 2', style: 'standard' },
      { id: 3, name: 'M3', label: 'Mesa 3', style: 'standard' },
      { id: 4, name: 'B1', label: 'Barra 1', style: 'bar' },
      { id: 5, name: 'T1', label: 'Terraza 1', style: 'terraza' }
    ]
  },
  cafe: {
    layout: { columns: 2, gap: '20px' },
    items: [
      { id: 1, name: 'M1', label: 'Mesa 1', style: 'standard' },
      { id: 2, name: 'M2', label: 'Mesa 2', style: 'standard' },
      { id: 3, name: 'V1', label: 'VIP 1', style: 'vip' },
      { id: 4, name: 'B1', label: 'Barra 1', style: 'bar' }
    ]
  }
};
export const mockMenus = {
  burgers: [
    {
      id: 'b1',
      name: 'Burger Clásica',
      price: 6.99,
      image: 'fotos food fast burgers/hambuwesa.png',
      description: 'Jugosa carne de res 150g, lechuga fresca, tomate maduro, cebolla morada y salsa especial de la casa en pan brioche tostado.'
    },
    {
      id: 'b2',
      name: 'Doble Queso & Bacon',
      price: 8.49,
      image: 'fotos food fast burgers/hamburguesa-doble-queso-bacon-1024x683.png',
      description: 'Doble carne smash, doble capa de queso cheddar derretido, crujiente bacon ahumado, pepinillos y salsa BBQ.'
    },
    {
      id: 'b3',
      name: 'Papas Fritas Artesanales',
      price: 1.99,
      image: 'fotos food fast burgers/photodune-1669472-french-fries-xs.jpg',
      description: 'Papas frescas cortadas a mano, doble fritura para extra crocancia, sazonadas con sal de mar y hierbas finas.',
      options: [
        {
          id: 'size',
          name: 'Tamaño',
          required: true,
          multiSelect: false,
          choices: [
            { id: 'small', name: 'Pequeña', priceModifier: 0 },
            { id: 'large', name: 'Grande', priceModifier: 1.50 }
          ]
        }
      ]
    },
    {
      id: 'b4',
      name: 'Bebida Refrescante',
      price: 1.49,
      image: 'fotos food fast burgers/unnamed.jpg',
      description: 'Bebidas frías preparadas al momento con ingredientes naturales. Perfectas para acompañar tu combo.',
      variants: {
        required: true,
        items: [
          { id: 'b4-lim', name: 'Limonada Natural', price: 2.49 },
          { id: 'b4-gas', name: 'Gaseosa 500ml', price: 2.99 },
          { id: 'b4-jug', name: 'Jugo Natural del Día', price: 3.49 },
          { id: 'b4-agua', name: 'Agua Embotellada', price: 1.99 }
        ]
      }
    },
    {
      id: 'b5',
      name: 'Combo Burger Supremo',
      price: 14.99,
      image: 'fotos food fast burgers/amburgesa clasica.webp',
      description: 'Nuestra Burger Clásica + Papas Grandes + Bebida a elección. La combinación perfecta para saciar el hambre.',
      options: [
        {
          id: 'bebida',
          name: 'Bebida del Combo',
          required: true,
          multiSelect: false,
          choices: [
            { id: 'limonada', name: 'Limonada Natural', priceModifier: 0 },
            { id: 'gaseosa', name: 'Gaseosa 500ml', priceModifier: 0.50 },
            { id: 'jugo', name: 'Jugo Natural', priceModifier: 1.00 }
          ]
        },
        {
          id: 'extras',
          name: 'Extras Premium',
          required: false,
          multiSelect: true,
          choices: [
            { id: 'bacon', name: 'Extra Bacon Crujiente', priceModifier: 1.99 },
            { id: 'queso', name: 'Extra Queso Cheddar', priceModifier: 1.29 },
            { id: 'huevo', name: 'Huevo Frito Estrellado', priceModifier: 1.49 }
          ]
        }
      ]
    }
  ],
  italian: [
    {
      id: 'i1',
      name: 'Pasta Carbonara Tradicional',
      price: 13.99,
      image: 'fotos italian taste/carbonara.jpg',
      description: 'Auténtica receta romana con yema de huevo, queso pecorino, pancetta italiana y pimienta negra recién molida.',
      options: [
        {
          id: 'pasta-type',
          name: 'Tipo de Pasta',
          required: true,
          multiSelect: false,
          choices: [
            { id: 'spaghetti', name: 'Spaghetti al Dente', priceModifier: 0 },
            { id: 'penne', name: 'Penne Rigate', priceModifier: 0 },
            { id: 'fettuccine', name: 'Fettuccine Fresco', priceModifier: 1.00 }
          ]
        }
      ]
    },
    {
      id: 'i2',
      name: 'Pizza Margarita Napolitana',
      price: 12.99,
      image: 'fotos italian taste/pizza.jpg',
      description: 'Masa madre de 48h, salsa de tomate San Marzano, mozzarella fior di latte y albahaca fresca. Horneada a leña.',
      options: [
        {
          id: 'size',
          name: 'Tamaño',
          required: true,
          multiSelect: false,
          choices: [
            { id: 'personal', name: 'Personal (4 porciones)', priceModifier: -3.00 },
            { id: 'mediana', name: 'Mediana (6 porciones)', priceModifier: 0 },
            { id: 'familiar', name: 'Familiar (8 porciones)', priceModifier: 7.00 }
          ]
        },
        {
          id: 'extras',
          name: 'Ingredientes Extra',
          required: false,
          multiSelect: true,
          choices: [
            { id: 'pepperoni', name: 'Pepperoni Italiano', priceModifier: 2.50 },
            { id: 'champinones', name: 'Champiñones Portobello', priceModifier: 1.99 }
          ]
        }
      ]
    }
  ],
  mexican: [
    { 
      id: 'm1', 
      name: 'Tacos al Pastor', 
      price: 9.99, 
      image: 'fotos viva mexico/tacos.jpg',
      description: 'Tres tacos de cerdo marinado adobado, piña asada, cebolla, cilantro y salsa verde en tortillas de maíz hechas a mano.'
    },
    { 
      id: 'm2', 
      name: 'Burrito Supreme', 
      price: 10.99, 
      image: 'fotos viva mexico/burritos.jpg',
      description: 'Tortilla de harina grande rellena de carne asada, arroz, frijoles, guacamole, crema agria, queso y pico de gallo.'
    },
    { 
      id: 'm3', 
      name: 'Nachos Supremos', 
      price: 7.99, 
      image: 'fotos viva mexico/nachos.jpg',
      description: 'Totopos de maíz cubiertos con queso fundido, jalapeños, frijoles refritos, pico de gallo, guacamole y crema agria.'
    }
  ],
  cafe: [
    { 
      id: 'c1', 
      name: 'Café Latte Artesanal', 
      price: 4.49, 
      image: 'cafe aroma/latte.jpg',
      description: 'Espresso doble con leche vaporizada y microespuma, decorado con latte art. Granos 100% arábica de origen único.'
    },
    { 
      id: 'c2', 
      name: 'Cheesecake de Fresa', 
      price: 6.99, 
      image: 'cafe aroma/cheesecake.webp',
      description: 'Cremoso cheesecake estilo Nueva York sobre base de galleta Graham, cubierto con coulis de fresas naturales.'
    },
    { 
      id: 'c3', 
      name: 'Brownie de Chocolate Negro', 
      price: 5.99, 
      image: 'cafe aroma/brownie.jpg',
      description: 'Intenso brownie de chocolate belga 70% cacao, con trozos de nuez pecana y servido tibio con un toque de vainilla.'
    }
  ]
};

export const mockUsers = [
  { 
    user: "admin", 
    pass: "1234", 
    name: "Administrador",
    email: "admin@expressflavor.com",
    phone: "+505 8888-9999",
    avatar: "https://ui-avatars.com/api/?name=Administrador&background=1d05b7&color=fff&size=128",
    role: "admin",
    favorites: ["burgers", "italian"],
    ordersCount: 47
  },
  { 
    user: "test", 
    pass: "test", 
    name: "Usuario Prueba",
    email: "test@email.com",
    phone: "+505 7777-8888",
    avatar: "https://ui-avatars.com/api/?name=Usuario+Prueba&background=ff4081&color=fff&size=128",
    role: "customer",
    favorites: ["mexican", "cafe"],
    ordersCount: 12
  }
];
export const mockReports = [];

export const mockReservations = {
  burgers: [],
  italian: [],
  mexican: [],
  cafe: []
};

export const mockExchangeRates = {
  USD: { symbol: '$',   rate: 1 },
  ARS: { symbol: 'ARS$', rate: 1015 },
  EUR: { symbol: '€',   rate: 0.92 },
  MXN: { symbol: 'MX$', rate: 17.5 },
  NIO: { symbol: 'C$',  rate: 36.4 }
};

export const mockItemStats = {
  burgers: {
    'b1': 14,
    'b5': 23,
    'b3': 9,
    'b4': 6,
    'b2': 11
  },
  italian: {
    'i2': 18,   // Pizza Margarita
    'i1': 12    // Pasta Carbonara
  },
  mexican: {
    'm1': 21,   // Tacos al Pastor
    'm2': 8,    // Burrito Supreme
    'm3': 15    // Nachos Supremos
  },
  cafe: {
    'c1': 30,   // Café Latte (el más vendido)
    'c2': 22,   // Cheesecake
    'c3': 10    // Brownie
  }
};