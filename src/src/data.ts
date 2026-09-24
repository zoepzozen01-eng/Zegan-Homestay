import { Room, CafeItem, AddOn, Review } from './types';
import roomEkonomi from './assets/images/room_ekonomi_1782631326725.jpg';
import roomStandard from './assets/images/room_standard_1782631345828.jpg';
import roomStandardMadya from './assets/images/room_standard_madya_1782631361791.jpg';
import roomFamily from './assets/images/room_family_1782631379795.jpg';
import roomStandardUtama from './assets/images/room_standard_utama_1782631393687.jpg';
import foodNila from './assets/images/food_nila_bakar_goreng_1782631830281.jpg';
import foodTelurDadar from './assets/images/food_telur_dadar_1782631845387.jpg';
import foodNasiPutih from './assets/images/food_nasi_putih_1782631858970.jpg';
import foodSambalEkstra from './assets/images/food_sambal_ekstra_1782631872772.jpg';
import snackBakwan from './assets/images/snack_bakwan_1782631886482.jpg';
import snackMendoan from './assets/images/snack_mendoan_1782631898593.jpg';
import snackPisangGoreng from './assets/images/snack_pisang_goreng_1782631914027.jpg';
import drinkWedangUwuh from './assets/images/drink_wedang_uwuh_1782631928385.jpg';
import zeganExterior from './assets/images/zegan_exterior_1782631309135.jpg';
import zeganHeroView from './assets/images/zegan_hero_view_1782628350361.jpg';

export const ROOMS: Room[] = [
  {
    id: 'standard-room-utama',
    name: 'Standard Room Utama',
    price: 200000,
    weekdayPrice: 200000,
    weekendPrice: 250000,
    weekend_price: 250000,
    roomNumbers: '1 & 2',
    description: {
      id: 'Kamar tipe Utama yang modern, privat, dan nyaman dengan Kamar Mandi Dalam (En-suite) & Closet Duduk. Dilengkapi Double Bed, AC, Air Mineral, dan Free WiFi.',
      en: 'Modern, private, and comfortable Standard Room Utama with Private En-suite Bathroom & Seated Toilet. Features Double Bed, AC, Mineral Water, and Free WiFi.'
    },
    image: roomStandardUtama,
    size: '20 m²',
    capacity: 2,
    bedType: {
      id: '1 Kasur Double (Double Bed)',
      en: '1 Double Bed'
    },
    amenities: ['wifi', 'ac', 'private-bathroom'],
    rating: 4.9
  },
  {
    id: 'standard-room-madya',
    name: 'Standard Room Madya',
    price: 175000,
    weekdayPrice: 175000,
    weekendPrice: 200000,
    weekend_price: 200000,
    roomNumbers: '4',
    description: {
      id: 'Kamar Standard Madya yang nyaman dengan Double Bed, AC, Closet Duduk, Air Mineral, dan Free WiFi.',
      en: 'Comfortable Standard Room Madya with Double Bed, AC, Seated Toilet, Mineral Water, and Free WiFi.'
    },
    image: roomStandardMadya,
    size: '18 m²',
    capacity: 2,
    bedType: {
      id: '1 Kasur Double (Double Bed)',
      en: '1 Double Bed'
    },
    amenities: ['wifi', 'ac'],
    rating: 4.8
  },
  {
    id: 'standard-room-pratama',
    name: 'Standard Room Pratama',
    price: 150000,
    weekdayPrice: 150000,
    weekendPrice: 175000,
    weekend_price: 175000,
    roomNumbers: '3 & 5',
    description: {
      id: 'Kamar Standard Pratama yang nyaman. Kamar 3 (Double Bed) & Kamar 5 (Twin Bed Sorong). Dilengkapi AC, Closet Duduk, Air Mineral, dan Free WiFi.',
      en: 'Comfortable Standard Room Pratama. Room 3 (Double Bed) & Room 5 (Twin Pull-out Bed). Features AC, Seated Toilet, Mineral Water, and Free WiFi.'
    },
    image: roomStandard,
    size: '16 m²',
    capacity: 2,
    bedType: {
      id: 'Double Bed (Kmr 3) / Twin Bed Sorong (Kmr 5)',
      en: 'Double Bed (Rm 3) / Twin Bed (Rm 5)'
    },
    amenities: ['wifi', 'ac'],
    rating: 4.7
  },
  {
    id: 'family',
    name: 'Family Room',
    price: 200000,
    weekdayPrice: 200000,
    weekendPrice: 250000,
    weekend_price: 250000,
    roomNumbers: '6',
    description: {
      id: 'Kamar Keluarga luas untuk kapasitas hingga 4 orang dengan 2 Double Bed, AC, Closet Duduk, Air Mineral, dan Free WiFi.',
      en: 'Spacious Family Room for up to 4 guests with 2 Double Beds, AC, Seated Toilet, Mineral Water, and Free WiFi.'
    },
    image: roomFamily,
    size: '28 m²',
    capacity: 4,
    bedType: {
      id: '2 Kasur Double (Duo Double Bed)',
      en: '2 Double Beds'
    },
    amenities: ['wifi', 'ac'],
    rating: 4.9
  },
  {
    id: 'ekonomi',
    name: 'Economis Room',
    price: 125000,
    weekdayPrice: 125000,
    weekendPrice: 150000,
    weekend_price: 150000,
    roomNumbers: '7 & 8',
    description: {
      id: 'Pilihan hemat Kamar Ekonomis (Tersedia 2 Unit Kamar: Kamar No. 7 & No. 8) untuk 1-2 orang per kamar. Dilengkapi AC, Closet Duduk, Air Mineral, dan Free WiFi.',
      en: 'Budget-friendly Economy Room (2 units available: Room No. 7 & No. 8) for up to 2 guests per room. Features AC, Seated Toilet, Mineral Water, and Free WiFi.'
    },
    image: roomEkonomi,
    size: '12 m²',
    capacity: 2,
    bedType: {
      id: '1 Kasur (Tersedia 2 Unit: No. 7 & 8)',
      en: '1 Bed (2 Units Available: No. 7 & 8)'
    },
    amenities: ['wifi', 'ac'],
    rating: 4.6
  }
];

export const CAFE_ITEMS: CafeItem[] = [
  // --- MAKANAN ---
  {
    id: 'nila-bakar-goreng',
    name: 'Nila Bakar / Goreng',
    category: 'food',
    price: 15000,
    description: {
      id: 'Ikan nila segar pilihan bakar bumbu kecap manis gurih atau goreng kering renyah, disajikan hangat dengan sambal khas dan lalapan segar.',
      en: 'Freshly selected tilapia fish, grilled with sweet savory soy seasoning or deep-fried crispy, served warm with signature sambal and fresh greens.'
    },
    image: foodNila,
    isBestSeller: true
  },
  {
    id: 'ayam-bakar-goreng',
    name: 'Ayam Bakar / Goreng',
    category: 'food',
    price: 12000,
    description: {
      id: 'Ayam ungkep bumbu tradisional yang empuk meresap, dibakar kecap harum atau digoreng gurih, disajikan lengkap dengan sambal dan lalapan.',
      en: 'Tender marinated chicken seasoned with traditional spices, grilled with aromatic sweet soy or fried savory, served with sambal and fresh vegetables.'
    },
    image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=400&auto=format&fit=crop',
    isBestSeller: true
  },
  {
    id: 'indomie-goreng-telur',
    name: 'Indomie Goreng + Telur',
    category: 'food',
    price: 10000,
    description: {
      id: 'Indomie goreng legendaris yang disajikan hangat dengan tambahan telur mata sapi/dadar dan taburan bawang goreng renyah.',
      en: 'Legendary Indomie fried noodles served warm with a sunny-side-up or scrambled egg and topped with crispy fried shallots.'
    },
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?q=80&w=400&auto=format&fit=crop',
    isBestSeller: true
  },
  {
    id: 'indomie-goreng',
    name: 'Indomie Goreng',
    category: 'food',
    price: 8000,
    description: {
      id: 'Indomie goreng klasik beraroma khas dengan bumbu rempah instan favorit, disajikan praktis.',
      en: 'Classic aromatic Indomie fried noodles with favorite seasonings, served hot and tasty.'
    },
    image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'indomie-rebus-telur',
    name: 'Indomie Rebus + Telur',
    category: 'food',
    price: 9000,
    description: {
      id: 'Indomie rebus dengan pilihan rasa soto/ayam bawang berkuah hangat gurih, disajikan lengkap dengan telur matang/setengah matang.',
      en: 'Indomie noodle soup with savory broth, served warm with a cooked or soft-boiled egg.'
    },
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'indomie-rebus',
    name: 'Indomie Rebus',
    category: 'food',
    price: 7000,
    description: {
      id: 'Indomie kuah hangat yang nikmat disruput saat santai sore hari di pedesaan.',
      en: 'Warm Indomie soup noodles, highly comforting to enjoy during a relaxing countryside afternoon.'
    },
    image: 'https://images.unsplash.com/photo-1552611052-33e04de081de?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'sayur-lodeh',
    name: 'Sayur Lodeh',
    category: 'food',
    price: 5000,
    description: {
      id: 'Sayur lodeh rumahan khas Jawa berisi aneka sayuran segar berkuah santan gurih yang hangat dan autentik.',
      en: 'Javanese home-style vegetable stew made with various fresh vegetables in warm, savory, and authentic coconut broth.'
    },
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'telur-dadar',
    name: 'Telur Dadar',
    category: 'food',
    price: 6000,
    description: {
      id: 'Telur dadar goreng gurih renyah dengan irisan daun bawang segar khas masakan rumah.',
      en: 'Crispy fried savory omelette with fresh spring onion slices, a traditional home favorite.'
    },
    image: foodTelurDadar
  },
  {
    id: 'nasi-putih',
    name: 'Nasi Putih',
    category: 'food',
    price: 5000,
    description: {
      id: 'Satu porsi nasi putih hangat yang pulen untuk melengkapi hidangan Anda.',
      en: 'A single portion of warm, fluffy white rice to complement your meals.'
    },
    image: foodNasiPutih
  },
  {
    id: 'sambal',
    name: 'Sambal Ekstra',
    category: 'food',
    price: 2000,
    description: {
      id: 'Ulekan sambal cabai segar dengan racikan bumbu khas Zegan yang pedas mantap.',
      en: 'Freshly ground chili paste seasoned with Zegan\'s signature recipe, delivering a fantastic spicy kick.'
    },
    image: foodSambalEkstra
  },
  {
    id: 'lalapan',
    name: 'Lalapan',
    category: 'food',
    price: 2000,
    description: {
      id: 'Potongan sayur lalap segar pendamping hidangan utama, terdiri dari timun, kemangi, dan kubis.',
      en: 'Fresh side vegetables to accompany your main courses, featuring cucumber, basil, and cabbage.'
    },
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'tahu-tempe',
    name: 'Tahu / Tempe Goreng',
    category: 'food',
    price: 2000,
    description: {
      id: 'Tahu atau tempe goreng bumbu bawang ketumbar klasik yang gurih dan disajikan hangat.',
      en: 'Crispy fried tofu or tempeh seasoned with classic garlic and coriander, served warm.'
    },
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'pop-mie',
    name: 'Pop Mie',
    category: 'food',
    price: 7000,
    description: {
      id: 'Mie instan cup praktis yang panas dan nikmat dinikmati kapan saja.',
      en: 'Practical instant cup noodles served steaming hot and delicious anytime.'
    },
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=400&auto=format&fit=crop'
  },

  // --- SNACK / GORENGAN ---
  {
    id: 'mendoan',
    name: 'Mendoan (3 pcs)',
    category: 'snack',
    price: 5000,
    description: {
      id: 'Tempe mendoan lebar khas Banyumasan dibalut adonan tepung daun bawang, digoreng setengah matang, disajikan hangat dengan kecap cabe rawit.',
      en: 'Traditional wide, thinly sliced tempeh coated in green onion batter, quick-fried, and served warm with sweet chili soy sauce.'
    },
    image: snackMendoan,
    isBestSeller: true
  },
  {
    id: 'bakwan',
    name: 'Bakwan (3 pcs)',
    category: 'snack',
    price: 5000,
    description: {
      id: 'Gorengan bakwan sayur renyah garing berisi potongan kubis dan wortel, sangat nikmat dicocol sambal atau cabai rawit.',
      en: 'Crispy deep-fried vegetable fritters packed with cabbage and carrots, perfect to enjoy with fresh chili or soy dip.'
    },
    image: snackBakwan
  },
  {
    id: 'pisang-goreng',
    name: 'Pisang Goreng (2 pcs)',
    category: 'snack',
    price: 5000,
    description: {
      id: 'Pisang pilihan digoreng tepung renyah dengan cita rasa manis alami, disajikan hangat untuk menemani kopi Anda.',
      en: 'Crispy batter-fried selected bananas, naturally sweet and served warm, an excellent match for your hot coffee.'
    },
    image: snackPisangGoreng,
    isBestSeller: true
  },
  {
    id: 'kentang-goreng',
    name: 'Kentang Goreng',
    category: 'snack',
    price: 6000,
    description: {
      id: 'Stik kentang goreng renyah bumbu garam gurih, disajikan hangat dengan saus sambal.',
      en: 'Crispy classic French fries tossed with a touch of savory salt, served warm with spicy chili dip.'
    },
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=400&auto=format&fit=crop'
  },

  // --- MINUMAN (COFFEE CATEGORY TABS) ---
  {
    id: 'kopi-hitam-manis',
    name: 'Kopi Hitam Manis',
    category: 'coffee',
    price: 5000,
    description: {
      id: 'Seduhan kopi hitam lokal tradisional beraroma harum disajikan manis hangat.',
      en: 'Aromatically brewed traditional local black coffee served warm and sweet.'
    },
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=400&auto=format&fit=crop',
    isBestSeller: true
  },
  {
    id: 'kopi-hitam-polos',
    name: 'Kopi Hitam (tanpa gula)',
    category: 'coffee',
    price: 4000,
    description: {
      id: 'Seduhan kopi hitam murni tanpa gula dengan cita rasa pekat dan kuat khas pedesaan.',
      en: 'Pure black coffee brewed without sugar, delivering a strong and rich traditional country flavor.'
    },
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'teh-panas-dingin',
    name: 'Teh Panas / Dingin',
    category: 'coffee',
    price: 4000,
    description: {
      id: 'Seduhan teh melati lokal khas Jawa yang harum, dapat disajikan panas yang menenangkan atau dingin menyegarkan.',
      en: 'Fragrant traditional Javanese jasmine tea brew, served as calming hot tea or refreshing iced tea.'
    },
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'jeruk-panas-dingin',
    name: 'Jeruk Panas / Dingin',
    category: 'coffee',
    price: 4000,
    description: {
      id: 'Perasan buah jeruk segar asli yang disajikan hangat ataupun dingin es dengan gula murni.',
      en: 'Freshly squeezed real orange juice, served comforting hot or ice-cold with pure sugar syrup.'
    },
    image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'lemon-tea',
    name: 'Lemon Tea',
    category: 'coffee',
    price: 8000,
    description: {
      id: 'Perpaduan teh berkualitas dengan perasan lemon segar asli, memberikan rasa manis asam yang seimbang.',
      en: 'A high-quality tea blend paired with fresh real lemon squeeze, offering a perfectly balanced sweet and sour taste.'
    },
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'teh-gula-batu',
    name: 'Teh Panas Gula Batu',
    category: 'coffee',
    price: 6000,
    description: {
      id: 'Seduhan teh melati panas pekat khas angkringan Yogyakarta yang disajikan dengan gula batu tradisional di dalamnya.',
      en: 'Rich hot jasmine tea served in traditional Yogyakarta style with slow-melting rock sugar.'
    },
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'jeruk-gula-batu',
    name: 'Jeruk Panas Gula Batu',
    category: 'coffee',
    price: 8000,
    description: {
      id: 'Perasan jeruk hangat alami disajikan dengan gula batu tradisional untuk rasa manis yang khas.',
      en: 'Warm natural orange squeeze served with traditional rock sugar cubes for a unique rustic sweetness.'
    },
    image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'susu-panas-dingin',
    name: 'Susu Panas / Dingin',
    category: 'coffee',
    price: 5000,
    description: {
      id: 'Segelas susu putih manis berkualitas, disajikan panas kuku yang menenangkan atau dingin es yang segar.',
      en: 'A glass of sweet quality milk, served warm and relaxing or iced and refreshing.'
    },
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=400&auto=format&fit=crop'
  },

  // --- HERBAL & JAMU ---
  {
    id: 'wedang-uwuh',
    name: 'Wedang Uwuh',
    category: 'herbal',
    price: 8000,
    description: {
      id: 'Minuman herbal tradisional khas Yogyakarta berbahan jahe, serutan kayu secang merah, cengkeh, kayu manis, pala, dan gula batu. Menghangatkan dan menyehatkan tubuh.',
      en: 'Yogyakarta signature herbal beverage brewed with ginger, red secang wood shavings, cloves, cinnamon, nutmeg, and rock sugar. Warm, soothing, and healthy.'
    },
    image: drinkWedangUwuh,
    isBestSeller: true
  }
];

export const ADD_ONS: AddOn[] = [
  {
    id: 'breakfast',
    name: {
      id: 'Sarapan Tradisional Gudeg/Nasi Liwet',
      en: 'Traditional Gudeg/Nasi Liwet Breakfast Set'
    },
    price: 45000,
    perNight: true,
    perGuest: true,
    icon: 'Coffee',
    description: {
      id: 'Sarapan khas Yogyakarta diantarkan langsung ke kamar Anda mulai pukul 07.00.',
      en: 'Authentic Yogyakarta breakfast delivered straight to your room starting from 07:00 AM.'
    }
  },
  {
    id: 'scooter',
    name: {
      id: 'Sewa Motor Matic',
      en: 'Automatic Scooter Rental'
    },
    price: 75000,
    perNight: true,
    perGuest: false,
    icon: 'Bike',
    description: {
      id: 'Sewa motor matic (termasuk 2 helm & jas hujan) untuk berkeliling sawah Kulon Progo.',
      en: 'Automatic scooter (includes 2 helmets & raincoats) to explore beautiful Kulon Progo rice fields.'
    }
  },
  {
    id: 'airport-transfer',
    name: {
      id: 'Antar-Jemput Bandara (YIA)',
      en: 'Airport Transfer (YIA Airport)'
    },
    price: 200000,
    perNight: false,
    perGuest: false,
    icon: 'Car',
    description: {
      id: 'Layanan penjemputan atau pengantaran mobil pribadi ber-AC dari/ke Bandara Internasional Yogyakarta.',
      en: 'Private air-conditioned car pick-up or drop-off from/to Yogyakarta International Airport.'
    }
  },
  {
    id: 'massage',
    name: {
      id: 'Pijat Tradisional Jawa (1 Jam)',
      en: 'Javanese Traditional Massage (1 Hour)'
    },
    price: 125000,
    perNight: false,
    perGuest: true,
    icon: 'Sparkles',
    description: {
      id: 'Pijat relaksasi tradisional oleh terapis lokal berpengalaman di kamar Anda.',
      en: 'Relaxing traditional body massage by experienced local therapist in the comfort of your room.'
    }
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    author: 'Ahmad Subarjo',
    rating: 5,
    comment: 'Suasana homestay-nya bener-bener dapet banget! Sangat tenang, kolam renangnya bersih, dan dekat sawah asri. Kopinya di cafe juga juara. Sangat direkomendasikan untuk keluarga!',
    date: '2026-06-15',
    roomType: 'Standard Room'
  },
  {
    id: 'rev-2',
    author: 'Sarah Jenkins',
    rating: 5,
    comment: 'An absolutely magical stay! The beautiful wooden carvings of the Standard Room Utama are breathtaking. The staff went above and beyond to make us feel at home. Kulon Progo is beautiful and quiet compared to central Yogyakarta. Will definitely return!',
    date: '2026-06-20',
    roomType: 'Standard Room Utama'
  },
  {
    id: 'rev-3',
    author: 'Budi Santoso',
    rating: 4,
    comment: 'Sangat cocok untuk liburan anak-anak. Family room luas, kolam renang aman untuk balita karena ada area dangkal. Mendoan hangat di cafenya enak banget sore-sore.',
    date: '2026-06-24',
    roomType: 'Family Room'
  }
];

export const GALLERY_IMAGES = [
  {
    url: zeganExterior,
    category: 'grounds',
    title: { id: 'Tampak Depan Homestay & Pendopo', en: 'Homestay Front & Joglo Pavilion' }
  },
  {
    url: roomStandardUtama,
    category: 'rooms',
    title: { id: 'Kamar Standard Utama', en: 'Standard Room Utama' }
  },
  {
    url: zeganExterior,
    category: 'pool',
    title: { id: 'Kolam Renang & Area Terbuka', en: 'Swimming Pool & Outdoor Area' }
  },
  {
    url: zeganHeroView,
    category: 'cafe',
    title: { id: 'Pemandangan Asri Sekitar Cafe', en: 'Lush Scenery Around Cafe' }
  },
  {
    url: roomFamily,
    category: 'rooms',
    title: { id: 'Kamar Family Room', en: 'Spacious Family Room' }
  },
  {
    url: zeganHeroView,
    category: 'grounds',
    title: { id: 'Suasana Alam Sekitar Homestay', en: 'Surrounding Natural Landscape' }
  },
  {
    url: zeganExterior,
    category: 'cafe',
    title: { id: 'Pemandangan Area Santai Cafe', en: 'Scenic Cafe Relaxation Area' }
  },
  {
    url: roomStandardMadya,
    category: 'rooms',
    title: { id: 'Kamar Standard Madya', en: 'Standard Room Madya' }
  },
  {
    url: roomStandard,
    category: 'rooms',
    title: { id: 'Kamar Standard Tradisional', en: 'Traditional Standard Room' }
  }
];

export const TRANSLATIONS = {
  id: {
    brand: 'Zegan Homestay',
    home: 'Beranda',
    rooms: 'Kamar',
    facilities: 'Fasilitas',
    gallery: 'Galeri',
    about: 'Tentang',
    reviews: 'Ulasan',
    contact: 'Kontak',
    bookNow: 'Booking Sekarang',
    checkAvailability: 'Cek Ketersediaan',
    heroTitle: 'Zegan : Homestay & Cafe',
    heroSubtitle: 'Zegan Homestay menghadirkan pengalaman menginap yang tenang, nyaman, dan penuh keakraban.',
    facilitiesTitle: 'Fasilitas Kami',
    poolTitle: 'Kolam Renang',
    poolDesc: 'Kolam renang bersih untuk keluarga berlatar alam.',
    wifiTitle: 'Free WiFi',
    wifiDesc: 'Akses internet cepat di seluruh area homestay.',
    parkingTitle: 'Parkir Luas',
    parkingDesc: 'Area parkir kendaraan aman dan sangat lega.',
    cafeTitle: 'Cafe Tradisional',
    cafeDesc: 'Menikmati seduhan kopi lokal & camilan khas desa.',
    roomsTitle: 'Pilihan Kamar',
    roomsSubtitle: 'Rasakan kehangatan arsitektur tradisional Jawa dengan fasilitas modern.',
    perNight: 'malam',
    viewDetail: 'Lihat Detail',
    readyToStay: 'Siap Menginap di Zegan?',
    readyToStaySub: 'Pesan kamar sekarang dan nikmati suasana homestay yang tenang dan nyaman.',
    footerText: 'Homestay tradisional bernuansa pedesaan dengan kenyamanan bintang lima di Kulon Progo, Yogyakarta.',
    // Booking Form
    bookingFormTitle: 'Formulir Pemesanan Kamar',
    bookingFormSub: 'Isi formulir di bawah untuk merencanakan liburan impian Anda.',
    checkIn: 'Tanggal Check-In',
    checkOut: 'Tanggal Check-Out',
    guestsCount: 'Jumlah Tamu',
    chooseRoom: 'Pilih Kamar',
    fullName: 'Nama Lengkap',
    email: 'Alamat Email',
    phone: 'Nomor WhatsApp / HP',
    specialRequests: 'Permintaan Khusus',
    addOnsTitle: 'Layanan & Fasilitas Tambahan (Opsional)',
    summaryTitle: 'Rincian Pemesanan',
    pricePerNight: 'Tarif Kamar',
    nightsCount: 'Jumlah Malam',
    baseTotal: 'Total Kamar',
    addOnsTotal: 'Layanan Tambahan',
    taxService: 'Pajak & Pelayanan (10%)',
    finalTotal: 'Total Pembayaran',
    submitBooking: 'Konfirmasi Pemesanan via WhatsApp',
    bookingSuccess: 'Pemesanan Berhasil Disiapkan!',
    bookingSuccessDesc: 'Klik tombol di bawah ini untuk mengirimkan detail reservasi Anda ke admin Zegan Homestay melalui WhatsApp.',
    sendWA: 'Kirim via WhatsApp',
    close: 'Tutup',
    // Reviews
    reviewsTitle: 'Ulasan Pengunjung',
    reviewsSubtitle: 'Apa kata mereka yang sudah merasakan ketenangan Zegan Homestay?',
    writeReview: 'Tulis Ulasan Anda',
    yourName: 'Nama Anda',
    yourRating: 'Rating',
    yourComment: 'Tulis tanggapan atau pengalaman Anda menginap di sini...',
    submitReview: 'Kirim Ulasan',
    // Cafe Menu Modal
    viewMenu: 'Lihat Menu Cafe',
    cafeMenuTitle: 'Menu Cafe Zegan',
    cafeMenuSubtitle: 'Nikmati hidangan khas pedesaan Jawa dan minuman herbal segar.',
    bestSeller: 'Terlaris',
    all: 'Semua',
    coffee: 'Minuman',
    herbal: 'Jamu & Herbal',
    food: 'Makanan Utama',
    snack: 'Camilan',
    // Gallery
    galleryTitle: 'Galeri Zegan',
    gallerySubtitle: 'Intip keindahan sudut homestay, kolam renang, dan lingkungan sekitar.',
    cat_all: 'Semua',
    cat_rooms: 'Kamar',
    cat_cafe: 'Cafe',
    cat_pool: 'Kolam Renang',
    cat_grounds: 'Sekitar Homestay',
    // About Section
    aboutTitle: 'Tentang Zegan Homestay',
    aboutParagraph1: 'Terletak di lanskap hijau Kulon Progo, Yogyakarta, Zegan Homestay adalah perpaduan harmonis antara keanggunan budaya tradisional Jawa dan kenyamanan modern. Terinspirasi oleh filosofi arsitektur tradisional Jawa, bangunan utama kami menggunakan kayu jati kuno berukir yang membawa kehangatan dan nuansa masa lalu yang tenang.',
    aboutParagraph2: 'Kami percaya pada keramahan khas keluarga Jawa. Dikelilingi oleh udara pedesaan yang sejuk, kolam renang yang menyegarkan, serta cafe yang menyajikan ramuan herbal tradisional dan masakan ndeso, Zegan Homestay bukan sekadar tempat menginap—ini adalah perjalanan pulang ke pelukan alam dan tradisi.',
    address: 'Alamat',
    fullAddress: 'Jl Wates km 20 Kalimenur Rt 07 Rw 04, Sukoreno Sentolo , Sentolo, Kulon Progo, Yogyakarta, Indonesia, 55664',
    workingHours: 'Jam Operasional Cafe',
    workingHoursVal: 'Setiap Hari: 08:00 - 23:00 WIB',
    contactAdmin: 'Hubungi Admin WhatsApp',
    contactAdminVal: '+62 851-8814-4499 (Admin Zegan)'
  },
  en: {
    brand: 'Zegan Homestay',
    home: 'Home',
    rooms: 'Rooms',
    facilities: 'Facilities',
    gallery: 'Gallery',
    about: 'About',
    reviews: 'Reviews',
    contact: 'Contact',
    bookNow: 'Book Now',
    checkAvailability: 'Check Availability',
    heroTitle: 'Zegan : Homestay & Cafe',
    heroSubtitle: 'Zegan Homestay presents a serene, comfortable, and intimate staying experience.',
    facilitiesTitle: 'Our Facilities',
    poolTitle: 'Swimming Pool',
    poolDesc: 'Clean family swimming pool set against scenic nature.',
    wifiTitle: 'Free WiFi',
    wifiDesc: 'High-speed internet access throughout the property.',
    parkingTitle: 'Spacious Parking',
    parkingDesc: 'Extensive and secure parking area for all vehicles.',
    cafeTitle: 'Traditional Cafe',
    cafeDesc: 'Savor local pour-over coffees and traditional Javanese snacks.',
    roomsTitle: 'Our Rooms',
    roomsSubtitle: 'Experience the warmth of traditional Javanese architecture with modern comforts.',
    perNight: 'night',
    viewDetail: 'View Details',
    readyToStay: 'Ready to stay at Zegan?',
    readyToStaySub: 'Book your sanctuary now and embrace the peaceful charm of Javanese heritage.',
    footerText: 'Traditional guesthouse with rural vibes and five-star comfort in Kulon Progo, Yogyakarta.',
    // Booking Form
    bookingFormTitle: 'Room Booking Form',
    bookingFormSub: 'Fill in the details below to plan your dream vacation.',
    checkIn: 'Check-In Date',
    checkOut: 'Check-Out Date',
    guestsCount: 'Guests',
    chooseRoom: 'Choose Room Type',
    fullName: 'Full Name',
    email: 'Email Address',
    phone: 'WhatsApp / Phone Number',
    specialRequests: 'Special Requests',
    addOnsTitle: 'Add-on Services (Optional)',
    summaryTitle: 'Booking Summary',
    pricePerNight: 'Room Rate',
    nightsCount: 'Nights',
    baseTotal: 'Room Total',
    addOnsTotal: 'Add-ons Total',
    taxService: 'Tax & Service (10%)',
    finalTotal: 'Total Payment',
    submitBooking: 'Confirm Booking via WhatsApp',
    bookingSuccess: 'Booking Prepared Successfully!',
    bookingSuccessDesc: 'Click the button below to send your reservation summary to Zegan Homestay admin via WhatsApp.',
    sendWA: 'Send via WhatsApp',
    close: 'Close',
    // Reviews
    reviewsTitle: 'Guest Reviews',
    reviewsSubtitle: 'What do guests say about their tranquil stays at Zegan Homestay?',
    writeReview: 'Write a Review',
    yourName: 'Your Name',
    yourRating: 'Rating',
    yourComment: 'Share your stay experience or thoughts here...',
    submitReview: 'Submit Review',
    // Cafe Menu Modal
    viewMenu: 'Browse Cafe Menu',
    cafeMenuTitle: 'Zegan Cafe Menu',
    cafeMenuSubtitle: 'Delight in traditional Javanese country meals and fresh herbal infusions.',
    bestSeller: 'Bestseller',
    all: 'All',
    coffee: 'Beverages',
    herbal: 'Herbal & Jamu',
    food: 'Main Course',
    snack: 'Snacks & Bites',
    // Gallery
    galleryTitle: 'Zegan Gallery',
    gallerySubtitle: 'Explore scenic corners of the homestay, pool, and surrounding green landscapes.',
    cat_all: 'All',
    cat_rooms: 'Rooms',
    cat_cafe: 'Cafe',
    cat_pool: 'Pool',
    cat_grounds: 'Around Guesthouse',
    // About Section
    aboutTitle: 'About Zegan Homestay',
    aboutParagraph1: 'Tucked away in the serene highlands of Kulon Progo, Yogyakarta, Zegan Homestay is a harmonious blend of authentic Javanese cultural elegance and modern holiday comfort. Inspired by the architectural philosophy of traditional Javanese structures, our villas are crafted using hand-restored antique teak wood, inviting you into a world of historic charm.',
    aboutParagraph2: 'At Zegan, family-centric warmth defines our service. Complemented by cool country breezes, an inviting family swimming pool, and an open-air cafe serving herbal wedang brews and classic rustic recipes, Zegan Homestay is more than a destination—it is a comforting return to nature and soulful tradition.',
    address: 'Address',
    fullAddress: 'Jl Wates km 20 Kalimenur Rt 07 Rw 04, Sukoreno Sentolo, Sentolo, Kulon Progo, Yogyakarta, Indonesia, 55664',
    workingHours: 'Cafe Opening Hours',
    workingHoursVal: 'Everyday: 08:00 AM - 11:00 PM',
    contactAdmin: 'WhatsApp Support',
    contactAdminVal: '+62 851-8814-4499 (Zegan Admin)'
  }
};
