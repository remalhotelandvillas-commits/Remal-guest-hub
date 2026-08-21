const SUPABASE_URL = 'https://tbsroleffqhyzbbfmtvp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRic3JvbGVmZnFoeXpiYmZtdHZwIiwicm9sZSI6InFub24iLCJpYXQiOjE3ODQ4MzUyMzMsImV4cCI6MjEwMDQxMTIzM30.oNKhoPJ7v__YJQW7flC9UsP2cIDHLMuxjqmf6_NvYW4';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let audioContext = null;
let audioEnabled = false;
let previousPendingCount = 0;
let roomServiceMenu = [];
let cartState = {};
let starredItems = JSON.parse(localStorage.getItem('remal_starred') || '{}');

let currentLang = 'en';
let currentView = 'client';
let currentCategory = 'All';
let cachedOffers = [];
let cachedRequests = [];
let cachedFeedback = [];
let activeAnnouncement = null;
let currentFeedbackRating = 5;

const i18n = {
  en: {
    welcome: "Welcome to Remal Hotel & Villas", lblOffers: "Offers", lblFacilities: "Facilities", lblService: "Service", lblFaq: "FAQ",
    facHeader: "Hotel Facilities & Amenities", facSub: "Explore our premium venues and spaces", reqHeader: "Request Guest Service",
    lblRoom: "Room Number", placeholderRoom: "e.g., 104 or Villa 02", lblServiceType: "Service Type",
    lblDetails: "Additional Notes / Request Details", placeholderDetails: "Specify your request here...", btnSubmit: "Send Request to Reception",
    whatsappBtn: "WhatsApp Reception", successMsg: "Request submitted successfully!", chatWhatsapp: "💬 Chat on WhatsApp",
    trackHeader: "📡 Track Active Requests", liveStatus: "Live Status (Optimistic)", trackEmpty: "Enter your room number above to track active requests in real time.",
    trackNoReq: "No active requests found for room ", loadingOffers: "Loading live offers...", noOffers: "No offers available in this category.",
    swipePhotos: "👈 Swipe or click arrows for photos 👉", bookInquiry: "Book / Inquiry →",
    faqHeaderTitle: "💡 Intelligent Assistant & FAQ", faqHeaderSub: "Instant answers to common hotel questions",
    folioTitle: "📄 My Room Folio & Charges", btnPrtFolio: "🖨️ Print Folio", folioPlaceholder: "Enter your room number above to view your live billing summary.",
    feedbackTitle: "⭐ Stay Feedback & Experience Rating", feedbackSub: "Share your thoughts to help us improve our services", ratingText: "Rating:", btnSubmitReview: "Submit Review",
    favTitle: "⭐ My Favorites & Recent Orders", favBadge: "Quick Access", favEmpty: "No starred favorite dishes yet.",
    menuHeader: "🍽️ Select Menu Items", menuBadge: "In-Room Dining", totalAmt: "Total Amount:", delivTime: "Preferred Delivery Time",
    bookingTitle: "Table / Spa Reservation Details", lblVenue: "Venue / Service", lblGuests: "Guests Count", lblBDate: "Reservation Date", lblBTime: "Preferred Time",
    wakeupTitle: "Wake-Up Call Scheduler", wakeupLabel: "Select Alarm Time",
    lateTitle: "Late Check-Out Request", lateLabel: "Requested Departure Time",
    services: [
      { val: "Table / Spa Reservation", text: "Table / Spa Reservation" },
      { val: "Wake-up Call Request", text: "Wake-up Call / Alarm Service" },
      { val: "Late Check-out Request", text: "Late Check-out / Extension" },
      { val: "Housekeeping", text: "Housekeeping / Room Cleaning" },
      { val: "Front Desk Inquiry", text: "Front Desk Inquiry" }, 
      { val: "Luggage Assistance", text: "Luggage Assistance" },
      { val: "Room Service / Dining", text: "Room Service / Order Food" }, 
      { val: "Maintenance / Technical Support", text: "Maintenance / Technical Support" },
      { val: "Laundry", text: "Laundry" }
    ]
  },
  ar: {
    welcome: "مرحباً بكم في فندق وڤلل رمال", lblOffers: "العروض", lblFacilities: "المرافق والخدمات", lblService: "طلب خدمة", lblFaq: "الأسئلة الشائعة",
    facHeader: "مرافق الفندق والخدمات", facSub: "استكشف أرقى مرافقنا وخدماتنا المميزة", reqHeader: "طلب خدمة النزلاء",
    lblRoom: "رقم الغرفة", placeholderRoom: "مثال: 104 أو فيلا 02", lblServiceType: "نوع الخدمة",
    lblDetails: "ملاحظات إضافية / تفاصيل الطلب", placeholderDetails: "اكتب تفاصيل طلبك هنا...", btnSubmit: "إرسال الطلب إلى الاستقبال",
    whatsappBtn: "واتساب الاستقبال", successMsg: "تم إرسال طلبك بنجاح!", chatWhatsapp: "💬 التحدث عبر واتساب",
    trackHeader: "📡 متابعة الطلبات الحالية", liveStatus: "حالة مباشرة", trackEmpty: "أدخل رقم الغرفة أعلاه لمتابعة طلباتك في الوقت الفعلي.",
    trackNoReq: "لا توجد طلبات مسجلة للغرفة ", loadingOffers: "جاري تحميل العروض المباشرة...", noOffers: "لا توجد عروض متاحة في هذه الفئة.",
    swipePhotos: "👈 اسحب أو اضغط الأسهم للصور 👉", bookInquiry: "حجز / استفسار ←",
    faqHeaderTitle: "💡 المساعد الذكي والأسئلة الشائعة", faqHeaderSub: "إجابات فورية على الأسئلة الشائعة في الفندق",
    folioTitle: "📄 كشف الحساب والمصاريف", btnPrtFolio: "🖨️ طباعة الكشف", folioPlaceholder: "أدخل رقم غرفتك أعلاه لعرض ملخص فواتيرك.",
    feedbackTitle: "⭐ تقييم الإقامة والخدمة", feedbackSub: "شارعنا رأيك لمساعدتنا على تحسين خدماتنا", ratingText: "التقييم:", btnSubmitReview: "إرسال التقييم",
    favTitle: "⭐ المفضلة والطلبات الأخيرة", favBadge: "وصول سريع", favEmpty: "لا توجد أطباق مفضلة حتى الآن.",
    menuHeader: "🍽️ اختر أصناف القائمة", menuBadge: "خدمة الغرف", totalAmt: "المبلغ الإجمالي:", delivTime: "وقت التوصيل المفضل",
    bookingTitle: "تفاصيل حجز الطاولة أو السبا", lblVenue: "المكان / الخدمة", lblGuests: "عدد الضيوف", lblBDate: "تاريخ الحجز", lblBTime: "الوقت المفضل",
    wakeupTitle: "جدولة خدمة الإيقاظ", wakeupLabel: "اختر وقت التنبيه",
    lateTitle: "طلب مغادرة متأخرة", lateLabel: "وقت المغادرة المطلوب",
    services: [
      { val: "Table / Spa Reservation", text: "حجز طاولة مطعم أو موعد سبا" },
      { val: "Wake-up Call Request", text: "خدمة الإيقاظ / التنبيه الصباحي" },
      { val: "Late Check-out Request", text: "طلب مغادرة متأخرة / تمديد الإقامة" },
      { val: "Housekeeping", text: "خدمة الغرف / تنظيف الغرفة (Housekeeping)" },
      { val: "Front Desk Inquiry", text: "استفسار الاستقبال" }, 
      { val: "Luggage Assistance", text: "مساعدة في الأمتعة" },
      { val: "Room Service / Dining", text: "خدمة الغرف / طلب طعام" }, 
      { val: "Maintenance / Technical Support", text: "الصيانة / الدعم الفني" },
      { val: "Laundry", text: "خدمة الغسيل (Laundry)" }
    ]
  },
  hi: {
    welcome: "रेमल होटल एंड विला में आपका स्वागत है", lblOffers: "विशेष ऑफ़र", lblFacilities: "सुविधाएं", lblService: "सेवा अनुरोध", lblFaq: "सामान्य प्रश्न",
    facHeader: "होटल सुविधाएं", facSub: "हमारे प्रीमियम स्थानों और सेवाओं का अन्वेषण करें", reqHeader: "अतिथि सेवा का अनुरोध करें",
    lblRoom: "कमरा संख्या", placeholderRoom: "उदा., 104 या विला 02", lblServiceType: "सेवा का प्रकार",
    lblDetails: "अतिरिक्त विवरण / अनुरोध", placeholderDetails: "अपना अनुरोध यहां दर्ज करें...", btnSubmit: "रिसेप्शन को अनुरोध भेजें",
    whatsappBtn: "व्हाट्सएप रिसेप्शन", successMsg: "आपका अनुरोध सफलतापूर्वक भेजा गया!", chatWhatsapp: "💬 व्हाट्सएप पर चैट करें",
    trackHeader: "📡 सक्रिय अनुरोध ट्रैकिंग", liveStatus: "लाइव स्थिति", trackEmpty: "वास्तविक समय में अनुरोध ट्रैक करने के लिए ऊपर कमरा नंबर दर्ज करें।",
    trackNoReq: "कमरा नंबर के लिए कोई अनुरोध नहीं मिला ", loadingOffers: "ऑफ़र लोड हो रहे हैं...", noOffers: "इस श्रेणी में कोई ऑफ़र उपलब्ध नहीं है।",
    swipePhotos: "👈 स्वाइप करें या फ़ोटो के लिए तीर दबाएं 👉", bookInquiry: "बुक / पूछताछ →",
    faqHeaderTitle: "💡 बुद्धिमान सहायक और सामान्य प्रश्न", faqHeaderSub: "आम होटल के सवालों के त्वरित जवाब",
    folioTitle: "📄 मेरा कमरा फोलियो और शुल्क", btnPrtFolio: "🖨️ फोलियो प्रिंट करें", folioPlaceholder: "अपना लाइव बिलिंग सारांश देखने के लिए ऊपर अपना कमरा नंबर दर्ज करें।",
    feedbackTitle: "⭐ ठहरने की प्रतिक्रिया और रेटिंग", feedbackSub: "अपनी सेवाएं सुधारने में हमारी मदद करें", ratingText: "रेटिंग:", btnSubmitReview: "समीक्षा जमा करें",
    favTitle: "⭐ मेरे पसंदीदा और हाल के ऑर्डर", favBadge: "त्वरित पहुंच", favEmpty: "अभी तक कोई पसंदीदा व्यंजन नहीं है।",
    menuHeader: "🍽️ मेनू आइटम चुनें", menuBadge: "इन-रूम डाइनिंग", totalAmt: "कुल राशि:", delivTime: "पसंदीदा डिलीवरी का समय",
    bookingTitle: "टेबल / स्पा बुकिंग विवरण", lblVenue: "स्थान / सेवा", lblGuests: "मेहमानों की संख्या", lblBDate: "बुकिंग की तारीख", lblBTime: "पसंदीदा समय",
    wakeupTitle: "वेक-अप कॉल शेड्यूलर", wakeupLabel: "अलार्म का समय चुनें",
    lateTitle: "देर से चेक-आउट अनुरोध", lateLabel: "अनुरोधित प्रस्थान समय",
    services: [
      { val: "Table / Spa Reservation", text: "टेबल या स्पा बुकिंग" },
      { val: "Wake-up Call Request", text: "वेक-अप कॉल / सुबह की अलार्म सेवा" },
      { val: "Late Check-out Request", text: "देर से चेक-आउट / समय बढ़ाना" },
      { val: "Housekeeping", text: "हाउसकीपिंग / कमरे की सफाई" },
      { val: "Front Desk Inquiry", text: "फ्रंट डेस्क पूछताछ" }, 
      { val: "Luggage Assistance", text: "सामान सहायता" },
      { val: "Room Service / Dining", text: "रूम सर्विस / खाना ऑर्डर करें" }, 
      { val: "Maintenance / Technical Support", text: "रखरखाव / तकनीकी सहायता" },
      { val: "Laundry", text: "लॉन्ड्ररी (कपड़े धोने की सेवा)" }
    ]
  }
};

const FAQ_DATA = [
  {
    q: { en: "What is the Wi-Fi password?", ar: "ما هي كلمة مرور الواي فاي؟", hi: "वाई-फाई पासवर्ड क्या है?" },
    a: { en: "Wi-Fi is completely free and open across the hotel. Connect to 'Remal_Guest' without any password.", ar: "الواي فاي مجاني ومفتوح في جميع أنحاء الفندق. اتصل بشبكة 'Remal_Guest' بدون كلمة مرور.", hi: "वाई-फाई पूरी तरह से मुफ़्त है। बिना किसी पासवर्ड के 'Remal_Guest' से कनेक्ट करें।" }
  },
  {
    q: { en: "What are the breakfast hours?", ar: "ما هي مواعيد وجبة الإفطار؟", hi: "नाश्ते का समय क्या है?" },
    a: { en: "Breakfast is served daily at Falaj Restaurant from 06:30 AM to 11:00 AM.", ar: "يُقدم الإفطار يومياً في مطعم الفلج من الساعة 06:30 صباحاً حتى 11:00 مساءً.", hi: "नाश्ता प्रतिदिन फलज रेस्टोरेंट में सुबह 06:30 से सुबह 11:00 बजे तक परोसा जाता है।" }
  },
  {
    q: { en: "How do I request a late check-out?", ar: "كيف يمكنني طلب مغادرة متأخرة؟", hi: "मैं देर से चेक-आउट का अनुरोध कैसे करूं?" },
    a: { en: "You can request a late check-out up to 16:00 (4:00 PM) directly in the 'Service' tab by selecting 'Late Check-out Request'.", ar: "يمكنك طلب مغادرة متأخرة حتى الساعة 16:00 مساءً مباشرة عبر علامة التبويب 'طلب خدمة'.", hi: "'सेवा' टैब में सीधे 'लेट चेक-आउट अनुरोध' चुनकर दोपहर 04:00 बजे तक अनुरोध कर सकते हैं।" }
  },
  {
    q: { en: "What are the swimming pool timings?", ar: "ما هي مواعيد مسبح الواحة؟", hi: "स्विमिंग पूल का समय क्या है?" },
    a: { en: "Al Waha Swimming Pool is open daily from 07:00 AM to 08:00 PM.", ar: "مسبح الواحة مفتوح يومياً من الساعة 07:00 صباحاً حتى 08:00 مساءً.", hi: "अल वाहा स्विमिंग पूल प्रतिदिन सुबह 07:00 से रात 08:00 बजे तक खुला रहता है।" }
  },
  {
    q: { en: "How can I order room service?", ar: "كيف يمكنني طلب خدمة الغرف؟", hi: "मैं रूम सर्विस कैसे ऑर्डर कर सकता हूं?" },
    a: { en: "Go to the 'Service' tab, select 'Room Service / Dining', pick your favorite dishes from our menu, and click send!", ar: "توجه إلى علامة التبويب 'طلب خدمة'، اختر 'خدمة الغرف'، ثم حدد أطباقك المفضلة وأرسل الطلب!", hi: "'सेवा' टैब पर जाएं, 'रूम सर्विस' चुनें, अपने पसंदीदा व्यंजन चुनें और भेजें!" }
  }
];

const HARDCODED_MENU = [
  { id: 'hm_bf1', categoryKey: 'Breakfast', catName: { en: 'Breakfast', ar: 'وجبة الإفطار', hi: 'नाश्ता' }, name: { en: 'Continental', ar: 'كونتيننتال', hi: 'महाद्वीपीय' }, desc: { en: 'Croissant, Muffin, Danish and Seasonal Sliced Fruits', ar: 'تشكيلة من الكرواسون والمفن والدانش، وفواكه موسمية مقطعة', hi: 'क्रॉसेंट, मफिन, दानिश और मौसमी कटे हुए फल' }, price: 49 },
  { id: 'hm_bf2', categoryKey: 'Breakfast', catName: { en: 'Breakfast', ar: 'وجبة الإفطار', hi: 'नाश्ता' }, name: { en: 'Emirati Flavors', ar: 'الفطور بالطعم الإماراتي', hi: 'अमीराती स्वाद' }, desc: { en: 'Harees, Chebab, Balaleet, Arabic Cheese, Labneh, Olives, Cucumber, Tomatoes, Foul Medames, Egg Shakshuka, Kuboos, and Seasonal Sliced Fruits', ar: 'هريس، جباب، بالاليط، جبن عريج، لبنة، زيتون، خيار، طماطم، فول مدمس، شكشوكة البيض، خبز، وفواكه موسمية مقطعة', hi: 'हरीस, चेबाब, बलालीट, अरबी पनीर, लाबनेह, जैतून, ककड़ी, टमाटर, फुल मेदमेस, अंडा शक्शुका' }, price: 59 }
];

const facilitiesData = [
  { 
    id: 'exterior', 
    images: ['Remal_exterior_view1.jpg', 'Remal_exterior_view2.jpg', 'Remal_exterior_view3.jpg', 'Remal_exterior_view4.jpg'], 
    title: { en: 'Hotel Exterior & Grounds', ar: 'المظهر الخارجي والمحيط', hi: 'होटल का बाहरी दृश्य' }, 
    desc: { en: 'Experience our pristine architecture and welcoming surroundings at Remal Hotel & Villas.', ar: 'استمتع بالتصميم المعماري الفريد والمحيط الهادئ في فندق وڤلل رمال.', hi: 'रेमल होटल एंड विला के शानदार वास्तुशिल्प का अनुभव करें।' }, 
    timing: { en: '24/7 Welcome', ar: 'ترحيب على مدار الساعة', hi: '24 घंटे स्वागत' } 
  },
  { 
    id: 'villas', 
    images: ['villa.jpg', 'villa-1.jpg', 'Villa1.jpg', 'Villa2.jpg', 'Villa3.jpg', 'villa2.jpg', 'villa3.jpg'], 
    title: { en: 'Luxury Hotel Villas', ar: 'الڤلل الفاخرة', hi: 'लक्जरी विला' }, 
    desc: { en: 'Private luxury villas offering supreme comfort, spacious living, and exclusive amenities.', ar: 'ڤلل فاخرة خاصة توفر أعلى مستويات الراحة والمساحات الواسعة.', hi: 'उत्कृष्ट आराम और विशाल रहने की जगह प्रदान करने वाले निजी लक्जरी विला।' }, 
    timing: { en: '24/7 Private Stay', ar: 'إقامة خاصة على مدار الساعة', hi: '24 घंटे निजी प्रवास' } 
  }
];

const categoriesTranslations = {
  en: { 'All': 'All Services', 'Falaj Restaurant': 'Falaj Restaurant', 'Sarab': 'Sarab Bar', 'Al Waha Pool': 'Al Waha Pool', 'The Spa': 'The Spa' },
  ar: { 'All': 'جميع الخدمات', 'Falaj Restaurant': 'مطعم الفلج', 'Sarab': 'بار سراب', 'Al Waha Pool': 'مسبح الواحة', 'The Spa': 'السبا' },
  hi: { 'All': 'सभी सेवाएं', 'Falaj Restaurant': 'फलज रेस्टोरेंट', 'Sarab': 'सराब बार', 'Al Waha Pool': 'अल वाहा पूल', 'The Spa': 'द स्पा' }
};

function validateRoomNumber(roomStr) {
  if (!roomStr) return false;
  let cleanVal = roomStr.trim();
  let num = parseInt(cleanVal, 10);
  if (isNaN(num)) return false;

  if (num >= 103 && num <= 144) return true;
  if (num >= 201 && num <= 246) return true;
  if (num >= 301 && num <= 348) return true;
  if (num >= 401 && num <= 448) return true;
  if (num >= 501 && num <= 520) return true;
  if (num >= 601 && num <= 608) return true;

  return false;
}

async function init() {
  const urlParams = new URLSearchParams(window.location.search);
  const room = urlParams.get('room');

  if (room && validateRoomNumber(room)) {
    const roomInd = document.getElementById('roomIndicator');
    if (roomInd) roomInd.innerText = `Room/Villa: ${room} • Remal Hotel`;
    const reqRoom = document.getElementById('req_room');
    if (reqRoom) reqRoom.value = room;
  }

  // Accès direct au Staff Panel sans condition de connexion
  const toggleBtn = document.getElementById('viewToggleBtn');
  if (toggleBtn) toggleBtn.classList.remove('hidden');

  const todayStr = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('booking_date');
  if (dateInput) dateInput.value = todayStr;

  setLang('en');
  renderFacilities();
  renderFaqList();
  
  await fetchMenuItemsFromCloud();
  await fetchOffersFromCloud();
  await fetchAnnouncementFromCloud();
  await fetchRequestsFromCloud();
  await fetchFeedbackFromCloud();
  
  renderClientFavoritesAndHistory();
  renderRoomFolioWidget();

  setupRealtimeSubscriptions();
}

function setupRealtimeSubscriptions() {
  supabaseClient
    .channel('public-db-changes-instant')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, () => { fetchRequestsFromCloud(); })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'laundry_slips' }, () => { fetchRequestsFromCloud(); })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, () => { fetchOffersFromCloud(); })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'feedback' }, () => { fetchFeedbackFromCloud(); })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => { fetchMenuItemsFromCloud(); })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => { fetchAnnouncementFromCloud(); })
    .subscribe();
}

function updateRequestsUIState() {
  const pendingRequests = cachedRequests.filter(r => r.status === 'Pending' || r.status === 'collected' || !r.status);
  if (pendingRequests.length > previousPendingCount) {
    playNotificationSound();
  }
  previousPendingCount = pendingRequests.length;

  const badge = document.getElementById('requestBadge');
  if (badge) {
    if (pendingRequests.length > 0) { 
      badge.innerText = pendingRequests.length; 
      badge.classList.remove('hidden'); 
    } else {
      badge.classList.add('hidden');
    }
  }

  if (currentView === 'admin') {
    renderAdminRequests();
    renderAnalyticsData();
  }
  renderClientTracker();
  renderClientFavoritesAndHistory();
  renderRoomFolioWidget();
}

// Ouvre directement le panneau d'administration sans mot de passe
function handleAdminAccess() {
  toggleAdminView();
}

function logoutAdmin() {
  window.location.reload();
}

function toggleAdminView() {
  const clientV = document.getElementById('clientView');
  const adminV = document.getElementById('adminView');
  const btn = document.getElementById('viewToggleBtn');

  if (currentView === 'client') {
    currentView = 'admin';
    if (clientV) clientV.classList.add('hidden');
    if (adminV) adminV.classList.remove('hidden');
    if (btn) btn.innerText = "📱 Client View";
    renderAdminList();
    renderAdminMenuList();
    renderAdminFeedback();
    renderAnalyticsData();
  } else {
    currentView = 'client';
    if (adminV) adminV.classList.add('hidden');
    if (clientV) clientV.classList.remove('hidden');
    if (btn) btn.innerText = "⚙️ Staff Panel";
    renderClientCards();
  }
}

function setFeedbackRating(rating) {
  currentFeedbackRating = rating;
  for (let i = 1; i <= 5; i++) {
    const star = document.getElementById(`star-${i}`);
    if (star) {
      if (i <= rating) star.className = "text-amber-400";
      else star.className = "text-stone-300";
    }
  }
}

async function submitGuestFeedback(event) {
  event.preventDefault();
  const room = document.getElementById('req_room')?.value?.trim() || 'General';
  const comment = document.getElementById('feedback_comment').value;

  await supabaseClient.from('feedback').insert([{ room, rating: currentFeedbackRating, comment }]);
  alert("Thank you for sharing your feedback with Remal Hotel & Villas!");
  document.getElementById('feedback_comment').value = '';
  setFeedbackRating(5);
  await fetchFeedbackFromCloud();
}

async function fetchFeedbackFromCloud() {
  const { data } = await supabaseClient
    .from('feedback')
    .select('id, room, rating, comment')
    .order('id', { ascending: false })
    .limit(20);
  cachedFeedback = data || [];
  if (currentView === 'admin') renderAdminFeedback();
}

function renderAdminFeedback() {
  const container = document.getElementById('adminFeedbackContainer');
  if (!container) return;
  if (cachedFeedback.length === 0) {
    container.innerHTML = `<p class="text-xs text-stone-400">No guest reviews submitted yet.</p>`;
    return;
  }
  container.innerHTML = cachedFeedback.map(fb => `
    <div class="p-5 bg-stone-50 rounded-2xl border border-stone-200 text-sm space-y-2">
      <div class="flex justify-between font-bold text-stone-900">
        <span>Room/Villa: ${fb.room}</span>
        <span class="text-amber-500 text-base">${'★'.repeat(fb.rating)}${'☆'.repeat(5 - fb.rating)}</span>
      </div>
      <p class="text-stone-700">${fb.comment}</p>
    </div>
  `).join('');
}

function renderFaqList() {
  const container = document.getElementById('faqContainer');
  if (!container) return;
  container.innerHTML = FAQ_DATA.map(item => `
    <div class="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 text-xs space-y-1">
      <p class="font-bold text-stone-900">❓ ${item.q[currentLang]}</p>
      <p class="text-stone-600 pl-4 border-l-2 border-remal-sand">${item.a[currentLang]}</p>
    </div>
  `).join('');
}

function filterFaq() {
  const searchInput = document.getElementById('faqSearchInput');
  if (!searchInput) return;
  const query = searchInput.value.toLowerCase();
  const container = document.getElementById('faqContainer');
  if (!container) return;

  const filtered = FAQ_DATA.filter(item => 
    item.q[currentLang].toLowerCase().includes(query) || 
    item.a[currentLang].toLowerCase().includes(query)
  );
  container.innerHTML = filtered.map(item => `
    <div class="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 text-xs space-y-1">
      <p class="font-bold text-stone-900">❓ ${item.q[currentLang]}</p>
      <p class="text-stone-600 pl-4 border-l-2 border-remal-sand">${item.a[currentLang]}</p>
    </div>
  `).join('');
}

async function fetchMenuItemsFromCloud() {
  const { data } = await supabaseClient.from('menu_items').select('*').order('id', { ascending: true });
  const formattedCloudItems = (data || []).map(item => ({
    ...item,
    desc: item.description || item.desc || '',
    catName: { en: item.category, ar: item.category, hi: item.category },
    name: { en: item.name, ar: item.name, hi: item.name },
    descObj: { en: item.description || item.desc || '', ar: item.description || item.desc || '', hi: item.description || item.desc || '' }
  }));
  roomServiceMenu = [...HARDCODED_MENU, ...formattedCloudItems];
  renderRoomServiceMenu();
  if (currentView === 'admin') renderAdminMenuList();
}

async function addMenuItem(event) {
  event.preventDefault();
  const nameEn = document.getElementById('food_name_en').value;
  const nameAr = document.getElementById('food_name_ar').value;
  const descEn = document.getElementById('food_desc_en').value;
  const descAr = document.getElementById('food_desc_ar').value;
  const price = parseFloat(document.getElementById('food_price').value);
  const category = document.getElementById('food_category').value;

  const fullItem = {
    name: `${nameEn} | ${nameAr}`,
    description: `${descEn} | ${descAr}`,
    price: price,
    category: category
  };

  await supabaseClient.from('menu_items').insert([fullItem]);
  alert('Dish added to database!');
  document.getElementById('foodMenuForm').reset();
  await fetchMenuItemsFromCloud();
}

async function deleteMenuItem(id) {
  if (String(id).startsWith('hm')) {
    alert("This item is part of the core PDF menu and cannot be deleted here.");
    return;
  }
  if (confirm('Delete dish from database?')) {
    await supabaseClient.from('menu_items').delete().eq('id', id);
    await fetchMenuItemsFromCloud();
  }
}

function renderAdminMenuList() {
  const container = document.getElementById('adminMenuListContainer');
  if (!container) return;
  if (roomServiceMenu.length === 0) { container.innerHTML = `<p class="text-xs text-stone-400">No dishes.</p>`; return; }
  
  const grouped = {};
  roomServiceMenu.forEach(item => {
    const catKey = item.catName ? item.catName.en : item.category;
    if (!grouped[catKey]) grouped[catKey] = [];
    grouped[catKey].push(item);
  });

  let html = '';
  for (const [category, items] of Object.entries(grouped)) {
    html += `<h4 class="text-xs font-bold text-stone-500 uppercase mt-4 mb-2 border-b border-stone-200 pb-1">${category}</h4>`;
    html += items.map(item => {
      const isHardcoded = String(item.id).startsWith('hm');
      const deleteBtn = isHardcoded 
        ? `<span class="text-[10px] bg-stone-200 text-stone-500 px-2.5 py-1 rounded font-bold">Fixed</span>`
        : `<button onclick="deleteMenuItem(${item.id})" class="text-rose-600 font-bold p-1 hover:underline">🗑️ Delete</button>`;
      
      const displayName = typeof item.name === 'object' ? (item.name[currentLang] || item.name.en) : item.name;
      const displayDesc = typeof item.desc === 'object' ? (item.desc[currentLang] || item.desc.en) : (item.description || item.desc || '');

      return `
      <div class="flex items-center justify-between p-3.5 mb-2 bg-stone-50 rounded-xl border border-stone-200 text-sm">
        <div><p class="font-bold text-stone-900">${displayName}</p><p class="text-xs text-stone-500">${displayDesc || ''}</p><p class="text-xs text-remal-sand font-semibold mt-0.5">AED ${item.price}</p></div>
        ${deleteBtn}
      </div>
    `}).join('');
  }
  container.innerHTML = html;
}

function toggleServiceDynamicFields() {
  const serviceEl = document.getElementById('req_service');
  if (!serviceEl) return;
  const selectedService = serviceEl.value;
  
  const roomServiceBlock = document.getElementById('roomServiceMenuBlock');
  const lateCheckoutBlock = document.getElementById('lateCheckoutBlock');
  const wakeupCallBlock = document.getElementById('wakeupCallBlock');
  const bookingBlock = document.getElementById('bookingBlock');

  if (roomServiceBlock) roomServiceBlock.classList.add('hidden');
  if (lateCheckoutBlock) lateCheckoutBlock.classList.add('hidden');
  if (wakeupCallBlock) wakeupCallBlock.classList.add('hidden');
  if (bookingBlock) bookingBlock.classList.add('hidden');

  if (selectedService === 'Room Service / Dining' && roomServiceBlock) {
    roomServiceBlock.classList.remove('hidden');
  } else if (selectedService === 'Late Check-out Request' && lateCheckoutBlock) {
    lateCheckoutBlock.classList.remove('hidden');
  } else if (selectedService === 'Wake-up Call Request' && wakeupCallBlock) {
    wakeupCallBlock.classList.remove('hidden');
  } else if (selectedService === 'Table / Spa Reservation' && bookingBlock) {
    bookingBlock.classList.remove('hidden');
  }
}

function toggleFavorite(itemId) {
  if (starredItems[itemId]) {
    delete starredItems[itemId];
  } else {
    starredItems[itemId] = true;
  }
  localStorage.setItem('remal_starred', JSON.stringify(starredItems));
  renderRoomServiceMenu();
  renderClientFavoritesAndHistory();
}

function renderRoomServiceMenu() {
  const container = document.getElementById('foodItemsContainer');
  if (!container) return;
  if (roomServiceMenu.length === 0) { container.innerHTML = `<p class="text-xs text-stone-400 text-center py-2">No menu items currently.</p>`; return; }
  
  const grouped = {};
  roomServiceMenu.forEach(item => {
    let catDisplay = item.catName ? (item.catName[currentLang] || item.catName.en) : item.category;
    if (!grouped[catDisplay]) grouped[catDisplay] = [];
    grouped[catDisplay].push(item);
  });

  let html = '';
  for (const [category, items] of Object.entries(grouped)) {
    html += `<h4 class="text-sm font-bold text-stone-900 border-b-2 border-remal-sand pb-1 mt-4 mb-2 uppercase">${category}</h4>`;
    html += items.map(item => {
      let nameText = typeof item.name === 'object' ? (item.name[currentLang] || item.name.en) : item.name;
      let descText = typeof item.desc === 'object' ? (item.desc[currentLang] || item.desc.en) : (item.description || item.desc || '');
      const isStarred = starredItems[item.id] ? 'text-amber-500 fill-amber-500' : 'text-stone-300';

      return `
      <div class="flex justify-between items-center bg-white p-3 mb-2 rounded-xl border border-stone-200 text-xs shadow-sm">
        <div class="flex items-start space-x-2 pr-2" ${currentLang === 'ar' ? 'dir="rtl"' : 'dir="ltr"'}>
          <button type="button" onclick="toggleFavorite('${item.id}')" class="mt-0.5 text-base focus:outline-none ${isStarred}">★</button>
          <div class="space-y-1">
            <p class="font-bold text-stone-900 text-sm leading-tight">${nameText}</p>
            ${descText ? `<p class="text-[11px] text-stone-500 leading-snug">${descText}</p>` : ''}
            <p class="text-remal-sand font-bold text-xs">AED ${item.price}</p>
          </div>
        </div>
        <div class="flex items-center space-x-2 bg-stone-100 rounded-lg p-1 shrink-0">
          <button type="button" onclick="updateCart('${item.id}', -1)" class="w-6 h-6 bg-white rounded font-bold text-stone-700 shadow-sm">-</button>
          <span id="qty-item-${item.id}" class="font-bold px-1.5 text-stone-900 w-4 text-center">${cartState[item.id] || 0}</span>
          <button type="button" onclick="updateCart('${item.id}', 1)" class="w-6 h-6 bg-stone-900 text-white rounded font-bold shadow-sm">+</button>
        </div>
      </div>
    `;
    }).join('');
  }
  container.innerHTML = html;
}

function renderClientFavoritesAndHistory() {
  const container = document.getElementById('clientFavoritesContainer');
  if (!container) return;
  
  const starredIds = Object.keys(starredItems).filter(id => starredItems[id]);
  const starredDishObjects = roomServiceMenu.filter(item => starredIds.includes(String(item.id)));

  let html = '';
  if (starredDishObjects.length > 0) {
    html += `<div class="space-y-1 mb-2"><p class="text-[10px] font-bold text-stone-500 uppercase">${i18n[currentLang].favTitle}</p>`;
    html += starredDishObjects.map(item => {
      let nameText = typeof item.name === 'object' ? (item.name[currentLang] || item.name.en) : item.name;
      return `<div class="flex justify-between items-center bg-stone-50 p-2 rounded-xl border border-stone-200 text-xs">
        <span class="font-bold text-stone-800">${nameText} (AED ${item.price})</span>
        <button type="button" onclick="updateCart('${item.id}', 1); switchGuestTab('request'); const sEl=document.getElementById('req_service'); if(sEl) sEl.value='Room Service / Dining'; toggleServiceDynamicFields();" class="bg-remal-sand text-white px-2.5 py-1 rounded-lg font-bold text-[10px]">Order +1</button>
      </div>`;
    }).join('');
    html += `</div>`;
  }

  const roomNum = document.getElementById('req_room')?.value?.trim();
  if (roomNum && validateRoomNumber(roomNum)) {
    const roomReqs = cachedRequests.filter(r => String(r.room).trim().toLowerCase() === roomNum.toLowerCase() && r.service && r.service.includes('Room Service'));
    if (roomReqs.length > 0) {
      html += `<div class="space-y-1"><p class="text-[10px] font-bold text-stone-500 uppercase">🕒 Recent Room Service Orders for Room ${roomNum}</p>`;
      html += roomReqs.slice(0, 2).map(req => `
        <div class="bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-[11px] space-y-1">
          <div class="flex justify-between text-stone-500 font-semibold text-[9px]"><span>Status: ${req.status}</span><span>ID #${req.id}</span></div>
          <p class="text-stone-800 font-medium whitespace-pre-line">${req.details}</p>
        </div>
      `).join('');
      html += `</div>`;
    }
  }

  if (!html) {
    html = `<p class="text-[11px] text-stone-400 italic">${i18n[currentLang].favEmpty}</p>`;
  }
  container.innerHTML = html;
}

function renderRoomFolioWidget() {
  const container = document.getElementById('clientRoomFolioContainer');
  if (!container) return;
  const roomNum = document.getElementById('req_room')?.value?.trim();

  if (!roomNum || !validateRoomNumber(roomNum)) {
    container.innerHTML = `<p class="text-[11px] text-stone-400 italic">${i18n[currentLang].folioPlaceholder}</p>`;
    return;
  }

  const roomReqs = cachedRequests.filter(r => String(r.room).trim().toLowerCase() === roomNum.toLowerCase());
  let totalSpent = 0;
  let itemsListHtml = '';

  roomReqs.forEach(req => {
    if (req.details && req.details.includes('AED')) {
      const match = req.details.match(/AED\s+([0-9]+(?:\.[0-9]+)?)/);
      if (match) {
        const amt = parseFloat(match[1]);
        totalSpent += amt;
        itemsListHtml += `<div class="flex justify-between py-1 border-b border-stone-100 text-stone-700"><span>[${req.service}] #${req.id}</span><span class="font-bold text-stone-900">AED ${amt}</span></div>`;
      }
    }
  });

  if (itemsListHtml === '') {
    itemsListHtml = `<p class="text-[11px] text-stone-400 italic">No billable charges recorded yet for room ${roomNum}.</p>`;
  }

  container.innerHTML = `
    <div class="space-y-2">
      <div class="max-h-36 overflow-y-auto pr-1 space-y-1">${itemsListHtml}</div>
      <div class="flex justify-between items-center pt-2 border-t border-stone-200 font-bold text-stone-900 text-sm">
        <span>Total Accrued Charges:</span>
        <span class="text-remal-sand font-serif-luxury">AED ${totalSpent}</span>
      </div>
    </div>
  `;
}

function onRoomNumberChange() {
  const roomInput = document.getElementById('req_room');
  const roomError = document.getElementById('roomErrorMsg');
  if (!roomInput) return;
  const val = roomInput.value.trim();

  if (val === '') {
    if (roomError) roomError.classList.add('hidden');
    roomInput.classList.remove('border-rose-500');
  } else if (!validateRoomNumber(val)) {
    if (roomError) roomError.classList.remove('hidden');
    roomInput.classList.add('border-rose-500');
  } else {
    if (roomError) roomError.classList.add('hidden');
    roomInput.classList.remove('border-rose-500');
  }

  renderClientTracker();
  renderClientFavoritesAndHistory();
  renderRoomFolioWidget();
}

function updateCart(itemId, change) {
  if (!cartState[itemId]) cartState[itemId] = 0;
  cartState[itemId] = Math.max(0, cartState[itemId] + change);
  const qtyEl = document.getElementById(`qty-item-${itemId}`);
  if (qtyEl) qtyEl.innerText = cartState[itemId];
  calculateCartTotal();
}

function calculateCartTotal() {
  let total = 0;
  roomServiceMenu.forEach(item => { total += item.price * (cartState[item.id] || 0); });
  const display = document.getElementById('cartTotalDisplay');
  if (display) display.innerText = `AED ${total}`;
  return total;
}

function renderFacilities() {
  const container = document.getElementById('facilitiesContainer');
  if (!container) return;
  const t = i18n[currentLang];

  container.innerHTML = facilitiesData.map((item) => {
    const titleText = (item.title && item.title[currentLang]) ? item.title[currentLang] : (item.title?.en || '');
    const descText = (item.desc && item.desc[currentLang]) ? item.desc[currentLang] : (item.desc?.en || '');
    const timingText = (item.timing && item.timing[currentLang]) ? item.timing[currentLang] : (item.timing?.en || '');

    return `
    <div class="remal-card rounded-3xl overflow-hidden shadow-sm bg-white border border-stone-200">
      <div class="h-56 bg-stone-100 relative">
        <img src="${item.images[0]}" class="w-full h-full object-cover" loading="lazy" onerror="this.onerror=null; this.src='logo.png';">
      </div>
      <div class="p-5 space-y-2">
        <h4 class="text-base font-serif-luxury font-bold text-stone-900">${titleText}</h4>
        <p class="text-xs text-stone-600 leading-relaxed">${descText}</p>
        <div class="pt-3 border-t border-stone-100 flex justify-between items-center text-[11px] font-semibold text-stone-500">
          <span>🕒 ${timingText}</span>
          <button type="button" onclick="switchGuestTab('request')" class="text-remal-sand hover:underline font-bold">${t.bookInquiry}</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

async function fetchAnnouncementFromCloud() {
  const { data } = await supabaseClient.from('announcements').select('*').order('id', { ascending: false }).limit(1);
  if (!data || data.length === 0) return;
  activeAnnouncement = data[0];
  renderAnnouncement();
}

function renderAnnouncement() {
  const banner = document.getElementById('announcementBanner');
  const textEl = document.getElementById('announcementText');
  if (!banner || !textEl) return;
  if (activeAnnouncement && activeAnnouncement.is_active) {
    textEl.innerText = `📢 ${activeAnnouncement.message[currentLang]}`;
    banner.classList.remove('hidden');
  } else banner.classList.add('hidden');
}

async function fetchOffersFromCloud() {
  const { data, error } = await supabaseClient
    .from('offers')
    .select('id, category, price, title, timing, image')
    .order('id', { ascending: false });
  
  if (error) {
    console.error("Erreur chargement offers:", error);
    return;
  }
  
  cachedOffers = data || [];
  renderClientCards();
  if (currentView === 'admin') renderAdminList();
}

async function fetchRequestsFromCloud() {
  const { data: generalData, error: generalError } = await supabaseClient
    .from('requests')
    .select('*')
    .order('id', { ascending: false })
    .limit(50);
    
  if (generalError) console.error("Erreur requests:", generalError);

  const { data: laundryData, error: laundryError } = await supabaseClient
    .from('laundry_slips')
    .select('*')
    .order('id', { ascending: false })
    .limit(50);

  if (laundryError) console.error("Erreur laundry_slips:", laundryError);

  const formattedLaundry = (laundryData || []).map(item => ({
    id: 'laundry-' + item.id,
    room: item.room || item.room_number || 'N/A',
    service: 'Laundry',
    details: item.details || item.notes || 'Standard laundry service requested',
    status: item.status || 'collected'
  }));

  cachedRequests = [...(generalData || []), ...formattedLaundry];
  
  updateRequestsUIState();
  renderLiveLaundryOrders(formattedLaundry);
}

function renderLiveLaundryOrders(laundryData) {
  let container = document.getElementById('liveLaundryOrdersContainer') || document.getElementById('adminLaundryContainer');
  
  if (!container) {
    const adminPanel = document.getElementById('adminRequestsPanel');
    if (adminPanel && !document.getElementById('dynamicLaundryBox')) {
      const box = document.createElement('div');
      box.id = 'dynamicLaundryBox';
      box.className = 'mb-6 space-y-4';
      adminPanel.prepend(box);
      container = box;
    } else {
      container = document.getElementById('dynamicLaundryBox');
    }
  }

  if (!container) return;

  if (!laundryData || laundryData.length === 0) {
    container.innerHTML = `<div class="p-4 bg-stone-50 rounded-2xl text-center text-xs text-stone-400">No active laundry plant orders.</div>`;
    return;
  }

  container.innerHTML = laundryData.map(order => {
    const clientNote = order.details ? order.details : "Standard laundry service requested.";
    const currentStatus = order.status || 'collected';

    return `
    <div class="p-5 bg-white rounded-3xl border-2 border-rose-200 shadow-md space-y-4 mb-4">
      <div class="bg-rose-50 border-l-4 border-rose-600 p-3.5 rounded-r-2xl text-rose-900 text-xs space-y-1 shadow-inner">
        <p class="font-bold uppercase tracking-wider flex items-center text-rose-700">🚨 ALERTE LAUNDRY PLANT — Chambre ${order.room || 'N/A'}</p>
        <p class="font-semibold italic text-stone-900 text-sm">"${clientNote}"</p>
      </div>

      <div class="flex justify-between items-center text-xs px-1">
        <span class="font-bold text-stone-900 text-sm">Chambre / Villa : ${order.room || 'N/A'}</span>
        <span class="bg-amber-100 text-amber-900 font-bold px-3 py-1 rounded-full uppercase text-[10px]">Statut : ${currentStatus}</span>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-stone-100">
        <button onclick="updateLaundryStatus('${order.id}', 'collected')" class="py-2.5 px-3 rounded-xl font-bold text-xs transition ${currentStatus === 'collected' ? 'bg-amber-600 text-white shadow' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'}">📦 Collected</button>
        <button onclick="updateLaundryStatus('${order.id}', 'washing')" class="py-2.5 px-3 rounded-xl font-bold text-xs transition ${currentStatus === 'washing' ? 'bg-blue-600 text-white shadow' : 'bg-blue-50 text-blue-800 hover:bg-blue-100'}">🧼 Washing</button>
        <button onclick="updateLaundryStatus('${order.id}', 'ready')" class="py-2.5 px-3 rounded-xl font-bold text-xs transition ${currentStatus === 'ready' ? 'bg-purple-600 text-white shadow' : 'bg-purple-50 text-purple-800 hover:bg-purple-100'}">✨ Ready</button>
        <button onclick="updateLaundryStatus('${order.id}', 'delivered')" class="py-2.5 px-3 rounded-xl font-bold text-xs transition ${currentStatus === 'delivered' ? 'bg-emerald-600 text-white shadow' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}">🚀 Delivered</button>
      </div>
    </div>
  `;
  }).join('');
}

async function updateLaundryStatus(id, newStatus) {
  const strId = String(id);
  const actualId = strId.startsWith('laundry-') ? strId.replace('laundry-', '') : strId;

  const { error } = await supabaseClient
    .from('laundry_slips')
    .update({ status: newStatus })
    .eq('id', actualId);

  if (error) {
    console.error("Erreur mise à jour statut laundry:", error);
  } else {
    await fetchRequestsFromCloud();
  }
}

function renderAnalyticsData() {
  const totalReq = cachedRequests.length;
  const completedReq = cachedRequests.filter(r => r.status === 'Completed' || r.status === 'delivered').length;
  const resolutionRate = totalReq > 0 ? Math.round((completedReq / totalReq) * 100) : 0;

  let totalRevenue = 0;
  const serviceCounts = {};

  cachedRequests.forEach(req => {
    const s = req.service || 'Other';
    serviceCounts[s] = (serviceCounts[s] || 0) + 1;

    if (req.details && req.details.includes('AED')) {
      const match = req.details.match(/AED\s+([0-9]+(?:\.[0-9]+)?)/);
      if (match) totalRevenue += parseFloat(match[1]);
    }
  });

  const statTotalReq = document.getElementById('statTotalReq');
  const statResolutionRate = document.getElementById('statResolutionRate');
  const statRevenue = document.getElementById('statRevenue');

  if (statTotalReq) statTotalReq.innerText = totalReq;
  if (statResolutionRate) statResolutionRate.innerText = `${resolutionRate}%`;
  if (statRevenue) statRevenue.innerText = `AED ${totalRevenue}`;

  const container = document.getElementById('analyticsContentContainer');
  if (!container) return;

  let analyticsHtml = `<div class="grid grid-cols-1 md:grid-cols-2 gap-6">`;
  analyticsHtml += `<div class="bg-stone-50 p-6 rounded-2xl border border-stone-200 space-y-3">`;
  analyticsHtml += `<p class="font-bold text-stone-800 uppercase text-xs tracking-wider">Requests by Department</p>`;
  for (const [srv, count] of Object.entries(serviceCounts)) {
    analyticsHtml += `<div class="flex justify-between items-center text-sm border-b border-stone-200 pb-2"><span>${srv}</span><span class="font-bold bg-white px-3 py-1 rounded border">${count}</span></div>`;
  }
  analyticsHtml += `</div></div>`;
  container.innerHTML = analyticsHtml;
}

function renderClientTracker() {
  const roomInput = document.getElementById('req_room');
  if (!roomInput) return;
  const roomNum = roomInput.value.trim().toLowerCase();
  const container = document.getElementById('clientTrackerContainer');
  if (!container) return;
  const t = i18n[currentLang];

  if (!roomNum || !validateRoomNumber(roomNum)) { 
    container.innerHTML = `<p class="text-center text-xs text-stone-400 py-3">${t.trackEmpty}</p>`; 
    return; 
  }

  const myRequests = cachedRequests.filter(r => String(r.room || '').trim().toLowerCase() === roomNum);
  
  if (myRequests.length === 0) { 
    container.innerHTML = `<p class="text-center text-xs text-stone-400 py-3">${t.trackNoReq} ${roomNum}.</p>`; 
    return; 
  }

  container.innerHTML = myRequests.map(req => {
    let statusBadgeClass = "bg-amber-100 text-amber-800";
    let statusText = req.status || 'Pending';
    let progressWidth = "w-1/3";

    if (req.service === 'Laundry') {
      if (statusText === 'washing') { progressWidth = "w-2/4"; }
      else if (statusText === 'ready') { progressWidth = "w-3/4"; }
      else if (statusText === 'delivered') { progressWidth = "w-full"; statusBadgeClass = "bg-emerald-100 text-emerald-800"; }
    } else {
      if (req.status === 'In Progress') { progressWidth = "w-2/3"; statusBadgeClass = "bg-blue-100 text-blue-800"; }
      else if (req.status === 'Completed') { progressWidth = "w-full"; statusBadgeClass = "bg-emerald-100 text-emerald-800"; }
    }

    return `
    <div class="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-2.5">
      <div class="flex justify-between items-center">
        <span class="font-bold text-stone-900">${req.service}</span>
        <span class="${statusBadgeClass} text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">${statusText}</span>
      </div>
      <p class="text-stone-600 bg-white p-2.5 rounded-xl border border-stone-100 whitespace-pre-line">${req.details}</p>
      <div class="space-y-1 pt-1">
        <div class="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
          <div class="bg-remal-sand h-full transition-all duration-500 ${progressWidth}"></div>
        </div>
      </div>
    </div>
  `;
  }).join('');
}

function renderCategoryFilters() {
  const container = document.getElementById('categoryFilters');
  if (!container) return;
  const cats = ['All', 'Falaj Restaurant', 'Sarab', 'Al Waha Pool', 'The Spa'];
  container.innerHTML = cats.map(cat => `<button onclick="filterCategory('${cat}')" class="px-4 py-2 rounded-full whitespace-nowrap text-xs font-semibold ${currentCategory === cat ? 'bg-remal-sand text-white' : 'bg-white text-stone-600 border'}">${categoriesTranslations[currentLang][cat] || cat}</button>`).join('');
}

function renderClientCards() {
  const container = document.getElementById('cardsContainer');
  if (!container) return;
  
  const t = i18n[currentLang];
  const filtered = currentCategory === 'All' 
    ? cachedOffers 
    : cachedOffers.filter(item => String(item.category).trim().toLowerCase() === String(currentCategory).trim().toLowerCase());

  if (filtered.length === 0) { 
    container.innerHTML = `<p class="text-center text-xs text-stone-400 py-8">${t.noOffers}</p>`; 
    return; 
  }

  container.innerHTML = filtered.map(item => {
    const titleText = (item.title && item.title[currentLang]) ? item.title[currentLang] : (item.title?.en || item.title || '');
    const timingText = (item.timing && item.timing[currentLang]) ? item.timing[currentLang] : (item.timing?.en || item.timing || '');
    
    return `
      <div class="remal-card rounded-3xl overflow-hidden bg-white shadow-sm border border-stone-200">
        <img src="${item.image}" class="w-full h-48 object-cover" onerror="this.onerror=null; this.src='logo.png';">
        <div class="p-5 space-y-3">
          <h3 class="text-lg font-serif-luxury font-bold text-stone-900">${titleText}</h3>
          <div class="flex justify-between items-center pt-3 border-t text-xs">
            <span class="text-stone-500">🕒 ${timingText}</span>
            <span class="text-remal-sand font-bold">AED ${item.price}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderAdminList() {
  const container = document.getElementById('adminListContainer');
  if (!container) return;
  if (cachedOffers.length === 0) { container.innerHTML = `<p class="text-xs text-stone-400">No active offers.</p>`; return; }
  container.innerHTML = cachedOffers.map(item => `
    <div class="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border text-sm">
      <div class="flex items-center space-x-4"><img src="${item.image}" class="w-16 h-16 object-cover rounded-xl shadow-sm" onerror="this.onerror=null; this.src='logo.png';"><div><p class="font-bold text-stone-900">${item.title?.en || item.title}</p><p class="text-remal-sand text-xs font-semibold mt-0.5">${item.category} • ${item.price}</p></div></div>
      <button onclick="deleteOffer(${item.id})" class="text-rose-600 font-bold p-2 hover:bg-rose-50 rounded-xl transition">🗑️ Delete</button>
    </div>
  `).join('');
}

function renderAdminRequests() {
  const container = document.getElementById('adminRequestsContainer');
  if (!container) return;
  if (cachedRequests.length === 0) { container.innerHTML = `<p class="text-sm text-stone-400 text-center py-6 col-span-2">No active requests.</p>`; return; }
  
  container.innerHTML = cachedRequests.map(req => {
    const isLaundry = req.service === 'Laundry';
    
    return `
    <div class="p-6 bg-stone-50 rounded-3xl border border-stone-200 text-sm space-y-4 flex flex-col justify-between shadow-sm">
      <div class="space-y-3">
        <div class="flex justify-between items-start">
          <div>
            <span class="font-bold text-stone-900 text-base">Room / Villa: ${req.room || 'N/A'}</span>
            <p class="text-remal-sand font-bold text-xs uppercase tracking-wide mt-0.5">${req.service}</p>
          </div>
          <span class="text-xs font-bold px-3 py-1 rounded-full uppercase ${req.status === 'Completed' || req.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${req.status || 'Pending'}</span>
        </div>
        <p class="text-stone-700 bg-white p-4 rounded-2xl border border-stone-200 leading-relaxed whitespace-pre-line">${req.details}</p>
      </div>
      <div class="flex justify-between items-center pt-3 border-t border-stone-200 text-xs">
        <div class="space-x-1.5">
          ${isLaundry ? `
            <span class="text-[11px] text-stone-500 font-bold italic">Managed via Laundry plant interface</span>
          ` : `
            <button onclick="updateRequestStatus('${req.id}', 'Pending')" class="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg font-bold">Pending</button>
            <button onclick="updateRequestStatus('${req.id}', 'In Progress')" class="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg font-bold">In Progress</button>
            <button onclick="updateRequestStatus('${req.id}', 'Completed')" class="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg font-bold">Completed</button>
          `}
        </div>
        <div class="flex items-center space-x-2">
          <button onclick="printRequestTicket('${req.id}')" class="bg-stone-900 text-white px-3.5 py-2 rounded-xl font-bold shadow">🖨️ Print</button>
          <button onclick="deleteRequest('${req.id}')" class="text-rose-600 font-bold p-2">🗑️</button>
        </div>
      </div>
    </div>
  `;
  }).join('');
}

async function updateRequestStatus(id, newStatus) {
  const strId = String(id);
  const req = cachedRequests.find(r => String(r.id) === strId);
  if (req) { req.status = newStatus; }
  updateRequestsUIState();

  if (!strId.startsWith('temp-')) {
    await supabaseClient.from('requests').update({ status: newStatus }).eq('id', id);
  }
  await fetchRequestsFromCloud();
}

async function deleteRequest(id) { 
  if (confirm('Voulez-vous vraiment supprimer cette demande ?')) { 
    const strId = String(id);
    cachedRequests = cachedRequests.filter(r => String(r.id) !== strId);
    updateRequestsUIState();

    if (!strId.startsWith('temp-')) {
      if (strId.startsWith('laundry-')) {
        const actualId = strId.replace('laundry-', '');
        await supabaseClient.from('laundry_slips').delete().eq('id', actualId);
      } else {
        await supabaseClient.from('requests').delete().eq('id', id);
      }
    }
    await fetchRequestsFromCloud();
  } 
}

async function deleteOffer(id) { if (confirm('Delete?')) { await supabaseClient.from('offers').delete().eq('id', id); await fetchOffersFromCloud(); } }

async function submitGuestRequest() {
  const roomInput = document.getElementById('req_room');
  const serviceEl = document.getElementById('req_service');
  const detailsEl = document.getElementById('req_details');
  if (!roomInput || !serviceEl) return;

  const room = roomInput.value.trim();
  const service = serviceEl.value;
  let details = detailsEl ? detailsEl.value : '';

  if (!room || !validateRoomNumber(room)) {
    alert("❌ Erreur : Veuillez entrer un numéro de chambre ou de villa valide.");
    roomInput.focus();
    return;
  }
  
  if (service === 'Room Service / Dining') {
    const total = calculateCartTotal();
    const deliveryTimeEl = document.getElementById('delivery_time');
    const deliveryTime = deliveryTimeEl ? deliveryTimeEl.value : 'As soon as possible';
    let orderSummary = [];
    roomServiceMenu.forEach(item => { 
      if (cartState[item.id] > 0) {
        let itemName = typeof item.name === 'object' ? (item.name[currentLang] || item.name.en) : item.name;
        orderSummary.push(`${cartState[item.id]}x ${itemName}`);
      }
    });
    details = `🛒 ORDER: ${orderSummary.join(', ')}\n💰 Total: AED ${total}\n🕒 Time: ${deliveryTime}\n📝 Notes: ${details || 'None'}`;
  } else if (service === 'Laundry') {
    details = `${details || 'Standard laundry service requested'}`;
  }

  const optimisticReq = { id: 'temp-' + Date.now(), room, service, details, status: service === 'Laundry' ? 'collected' : 'Pending' };
  cachedRequests.unshift(optimisticReq);
  updateRequestsUIState();

  const textMessage = encodeURIComponent(`Hello Remal Reception,\nI submitted a request for Room/Villa ${room}.\n\n*Service:* ${service}\n*Details:*\n${details}`);
  const whatsappBtn = document.getElementById('btnWhatsappDirect');
  if (whatsappBtn) whatsappBtn.href = `https://wa.me/971526966865?text=${textMessage}`;
  const whatsappConf = document.getElementById('whatsappConfirmation');
  if (whatsappConf) whatsappConf.classList.remove('hidden');
  
  if (detailsEl) detailsEl.value = '';
  
  cartState = {};
  renderRoomServiceMenu();
  calculateCartTotal();

  if (service === 'Laundry') {
    await supabaseClient.from('laundry_slips').insert([{ room: room, details: details, status: 'collected' }]);
  } else {
    await supabaseClient.from('requests').insert([{ room, service, details, status: 'Pending' }]);
  }

  await fetchRequestsFromCloud();
}

function switchGuestTab(tab) {
  const sections = ['guestOffersSection', 'guestFacilitiesSection', 'guestFaqSection', 'guestRequestSection'];
  sections.forEach(s => {
    const el = document.getElementById(s);
    if (el) el.classList.add('hidden');
  });

  const buttons = ['tabOffersBtn', 'tabFacilitiesBtn', 'tabFaqBtn', 'tabRequestBtn'];
  buttons.forEach(b => {
    const el = document.getElementById(b);
    if (el) el.className = "flex-1 py-2.5 px-3 rounded-xl text-stone-200 hover:text-white whitespace-nowrap transition";
  });

  if (tab === 'offers') { 
    const sec = document.getElementById('guestOffersSection');
    if (sec) sec.classList.remove('hidden'); 
    const b = document.getElementById('tabOffersBtn');
    if (b) b.className = "flex-1 py-2.5 px-3 rounded-xl bg-white text-stone-900 font-bold shadow-md whitespace-nowrap transition"; 
    renderClientCards();
  } else if (tab === 'facilities') { 
    const sec = document.getElementById('guestFacilitiesSection');
    if (sec) sec.classList.remove('hidden'); 
    const b = document.getElementById('tabFacilitiesBtn');
    if (b) b.className = "flex-1 py-2.5 px-3 rounded-xl bg-white text-stone-900 font-bold shadow-md whitespace-nowrap transition"; 
    renderFacilities();
  } else if (tab === 'faq') { 
    const sec = document.getElementById('guestFaqSection');
    if (sec) sec.classList.remove('hidden'); 
    const b = document.getElementById('tabFaqBtn');
    if (b) b.className = "flex-1 py-2.5 px-3 rounded-xl bg-white text-stone-900 font-bold shadow-md whitespace-nowrap transition"; 
    renderFaqList(); 
  } else if (tab === 'request') { 
    const sec = document.getElementById('guestRequestSection');
    if (sec) sec.classList.remove('hidden'); 
    const b = document.getElementById('tabRequestBtn');
    if (b) b.className = "flex-1 py-2.5 px-3 rounded-xl bg-white text-stone-900 font-bold shadow-md whitespace-nowrap transition"; 
    toggleServiceDynamicFields(); 
    renderClientTracker(); 
    renderClientFavoritesAndHistory(); 
    renderRoomFolioWidget(); 
  }
}

function switchAdminTab(tab) {
  ['adminOffersPanel', 'adminRequestsPanel', 'adminFeedbackPanel', 'adminAnalyticsPanel', 'adminBannerPanel'].forEach(p => {
    const el = document.getElementById(p);
    if (el) el.classList.add('hidden');
  });
  ['admTabOffers', 'admTabRequests', 'admTabFeedback', 'admTabAnalytics', 'admTabBanner'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.className = "px-5 py-3 rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200 whitespace-nowrap transition";
  });

  if (tab === 'offers') {
    document.getElementById('adminOffersPanel')?.classList.remove('hidden');
    const el = document.getElementById('admTabOffers');
    if (el) el.className = "px-5 py-3 rounded-xl bg-stone-900 text-white whitespace-nowrap shadow-sm transition";
  } else if (tab === 'requests') { 
    document.getElementById('adminRequestsPanel')?.classList.remove('hidden'); 
    const el = document.getElementById('admTabRequests');
    if (el) el.className = "px-5 py-3 rounded-xl bg-stone-900 text-white whitespace-nowrap shadow-sm transition relative";
    fetchRequestsFromCloud(); 
  } else if (tab === 'feedback') {
    document.getElementById('adminFeedbackPanel')?.classList.remove('hidden');
    const el = document.getElementById('admTabFeedback');
    if (el) el.className = "px-5 py-3 rounded-xl bg-stone-900 text-white whitespace-nowrap shadow-sm transition";
    fetchFeedbackFromCloud();
  } else if (tab === 'analytics') {
    document.getElementById('adminAnalyticsPanel')?.classList.remove('hidden');
    const el = document.getElementById('admTabAnalytics');
    if (el) el.className = "px-5 py-3 rounded-xl bg-stone-900 text-white whitespace-nowrap shadow-sm transition";
    renderAnalyticsData();
  } else if (tab === 'banner') {
    document.getElementById('adminBannerPanel')?.classList.remove('hidden');
    const el = document.getElementById('admTabBanner');
    if (el) el.className = "px-5 py-3 rounded-xl bg-stone-900 text-white whitespace-nowrap shadow-sm transition";
  }
}

function setLang(lang) {
  currentLang = lang;
  const t = i18n[lang];

  ['en', 'ar', 'hi'].forEach(l => {
    const btn = document.getElementById(`btn-${l}`);
    if (btn) {
      if (l === lang) {
        btn.className = "px-3 py-1.5 rounded-full bg-remal-sand text-white shadow-sm";
      } else {
        btn.className = "px-3 py-1.5 rounded-full text-stone-600 hover:text-stone-900";
      }
    }
  });

  const root = document.getElementById('htmlRoot');
  if (root) root.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  
  const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };

  setTxt('welcomeMsg', t.welcome);
  setTxt('lblTabOffers', t.lblOffers);
  setTxt('lblTabFacilities', t.lblFacilities);
  setTxt('lblTabFaq', t.lblFaq);
  setTxt('lblTabRequest', t.lblService);
  setTxt('reqHeader', t.reqHeader);
  setTxt('btnSubmitReq', t.btnSubmit);

  setTxt('facHeader', t.facHeader);
  setTxt('facSub', t.facSub);
  setTxt('faqHeaderTitle', t.faqHeaderTitle);
  setTxt('faqHeaderSub', t.faqHeaderSub);

  setTxt('lblFolioTitle', t.folioTitle);
  setTxt('btnPrtFolio', t.btnPrtFolio);
  setTxt('lblFeedbackTitle', t.feedbackTitle);
  setTxt('lblFeedbackSub', t.feedbackSub);
  setTxt('lblRatingText', t.ratingText);
  setTxt('btnSubmitReview', t.btnSubmitReview);
  setTxt('lblFavTitle', t.favTitle);
  setTxt('lblFavBadge', t.favBadge);
  setTxt('lblTrackHeader', t.trackHeader);
  setTxt('lblLiveStatus', t.liveStatus);

  setTxt('lblMenuHeader', t.menuHeader);
  setTxt('lblMenuBadge', t.menuBadge);
  setTxt('lblTotalAmt', t.totalAmt);
  setTxt('lblDelivTime', t.delivTime);

  setTxt('lblBookingTitle', t.bookingTitle);
  setTxt('lblVenue', t.lblVenue);
  setTxt('lblGuests', t.lblGuests);
  setTxt('lblBDate', t.lblBDate);
  setTxt('lblBTime', t.lblBTime);

  setTxt('lblWakeupTitle', t.wakeupTitle);
  setTxt('lblWakeupLabel', t.wakeupLabel);
  setTxt('lblLateTitle', t.lateTitle);
  setTxt('lblLateLabel', t.lateLabel);

  const selectService = document.getElementById('req_service');
  if (selectService) {
    selectService.innerHTML = t.services.map(s => `<option value="${s.val}">${s.text}</option>`).join('');
  }

  renderCategoryFilters(); 
  renderClientCards(); 
  renderFacilities(); 
  renderFaqList();
  renderAnnouncement(); 
  renderClientTracker();
  renderRoomServiceMenu();
  renderClientFavoritesAndHistory();
  renderRoomFolioWidget();
}

function filterCategory(cat) { currentCategory = cat; renderCategoryFilters(); renderClientCards(); }
window.onload = init;
