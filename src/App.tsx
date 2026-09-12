import React, { useState, useEffect } from 'react';
import { 
  User, 
  Medicine, 
  CartItem, 
  QuoteRequest, 
  ConsultationSpecialist, 
  CareNurse, 
  Order 
} from './types';
import { 
  MEDICINES, 
  formatNaira 
} from './data/mockData';
import { 
  auth, 
  db 
} from './lib/firebase';
import { 
  doc, 
  getDoc, 
  setDoc 
} from 'firebase/firestore';
import { 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  fetchLiveMedications, 
  fetchLiveOrdersAndRequests, 
  createLiveOrderOrRequest, 
  logoutUser, 
  SUPER_ADMIN_EMAIL,
  updateUserRole 
} from './lib/dbService';

// Components
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { MedicineDetailModal } from './components/MedicineDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { PaystackModal } from './components/PaystackModal';
import { ConsultationBookingModal } from './components/ConsultationBookingModal';
import { CareNurseHireModal } from './components/CareNurseHireModal';
import { TeleconferenceRoomModal } from './components/TeleconferenceRoomModal';
import { AuthModal } from './components/AuthModal';
import { Toast, ToastMessage } from './components/Toast';

// Views
import { ChatLandingView } from './views/ChatLandingView';
import { MarketFloorView } from './views/MarketFloorView';
import { UploadQuoteView } from './views/UploadQuoteView';
import { ConsultationsView } from './views/ConsultationsView';
import { CareNursesView } from './views/CareNursesView';
import { OrderTrackingView } from './views/OrderTrackingView';
import { AdminManagementView } from './views/AdminManagementView';
import { MessageSquareHeart } from 'lucide-react';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('chat');

  // User State - Live Firebase
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Live Medications State
  const [liveMedications, setLiveMedications] = useState<Medicine[]>(MEDICINES);

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Quotes & Orders State
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);

  // Modals State
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [selectedSpecialist, setSelectedSpecialist] = useState<ConsultationSpecialist | null>(null);
  const [selectedNurse, setSelectedNurse] = useState<CareNurse | null>(null);
  const [teleconferenceQuote, setTeleconferenceQuote] = useState<QuoteRequest | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Paystack Modal State
  const [paystackConfig, setPaystackConfig] = useState<{
    isOpen: boolean;
    amount: number;
    title: string;
    purpose: string;
    onSuccess: (ref: string) => void;
  }>({
    isOpen: false,
    amount: 0,
    title: 'Curadeck Healthcare',
    purpose: '',
    onSuccess: () => {}
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, description?: string) => {
    const id = 'toast_' + Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev, { id, type, title, description }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // 1. Listen for live Firebase Authentication changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            // Grant admin role if matching owner email
            if (fbUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && userData.role !== 'admin') {
              await updateUserRole(fbUser.uid, 'admin');
              setCurrentUser({ ...userData, role: 'admin' });
            } else {
              setCurrentUser(userData);
            }
          } else {
            const isSuper = fbUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
            const newUser: User = {
              id: fbUser.uid,
              name: fbUser.displayName || 'Valued Patient',
              email: fbUser.email || '',
              phone: fbUser.phoneNumber || '+234 800 000 0000',
              role: isSuper ? 'admin' : 'patient',
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', fbUser.uid), newUser);
            setCurrentUser(newUser);
          }
        } catch (err) {
          console.error('Error fetching user document:', err);
        }
      } else {
        setCurrentUser(null);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Fetch live medications and requests from Firestore
  const syncLiveData = async () => {
    try {
      const [meds, reqs] = await Promise.all([
        fetchLiveMedications(),
        fetchLiveOrdersAndRequests()
      ]);
      setLiveMedications(meds);
      const pending = reqs.filter(r => r.status === 'pending' || r.status === 'reviewing').length;
      setPendingRequestsCount(pending);
    } catch (err) {
      console.warn('Could not sync live Firestore records:', err);
    }
  };

  useEffect(() => {
    syncLiveData();
  }, []);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
      addToast('info', 'Signed Out', 'You have been safely signed out of Curadeck.');
    } catch (err) {
      addToast('error', 'Sign Out Error', 'Could not complete sign out.');
    }
  };

  // Cart Operations
  const handleAddToCart = (medicine: Medicine) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.medicine.id === medicine.id);
      if (existing) {
        return prev.map(item => 
          item.medicine.id === medicine.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { medicine, quantity: 1 }];
    });
    addToast('success', `${medicine.name} added to cart`, 'Open your cart at the top to proceed to delivery checkout.');
  };

  const handleUpdateQuantity = (medicineId: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.medicine.id === medicineId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const handleRemoveItem = (medicineId: string) => {
    setCartItems(prev => prev.filter(item => item.medicine.id !== medicineId));
    addToast('info', 'Item removed from cart');
  };

  // Checkout from Cart -> Writes to Firestore
  const handleProceedToCheckout = (orderDetails: {
    deliveryState: string;
    deliveryAddress: string;
    deliverySpeed: 'standard' | 'express';
    subtotal: number;
    teleconferenceFee: number;
    deliveryFee: number;
    total: number;
  }) => {
    setIsCartOpen(false);

    setPaystackConfig({
      isOpen: true,
      amount: orderDetails.total,
      title: 'Curadeck Medication Checkout',
      purpose: `Order of ${cartItems.length} items to ${orderDetails.deliveryState}`,
      onSuccess: async (paymentReference) => {
        const orderNum = 'CURA-' + Math.floor(10000 + Math.random() * 90000);
        
        // 1. Create real order object
        const newOrder: Order = {
          id: 'ord_' + Date.now(),
          orderNumber: orderNum,
          items: cartItems.map(i => ({
            name: i.medicine.name,
            price: i.medicine.price,
            quantity: i.quantity,
            image: i.medicine.image,
            isPrescription: i.medicine.prescriptionRequired
          })),
          subtotal: orderDetails.subtotal,
          teleconferenceFee: orderDetails.teleconferenceFee,
          deliveryFee: orderDetails.deliveryFee,
          discount: 0,
          total: orderDetails.total,
          patientName: currentUser?.name || 'Customer',
          patientPhone: currentUser?.phone || '+234 800 000 0000',
          deliveryAddress: orderDetails.deliveryAddress,
          deliveryCity: currentUser?.city || 'Lagos',
          deliveryState: orderDetails.deliveryState,
          paymentMethod: 'paystack_card',
          paymentReference,
          createdAt: new Date().toLocaleDateString(),
          status: 'confirmed',
          estimatedDelivery: orderDetails.deliverySpeed === 'express' ? 'Within 2 to 4 hours' : 'Tomorrow morning',
          rider: {
            name: 'Babatunde Fashola',
            phone: '+234 814 555 8899',
            bikeModel: 'TVS Neo 125cc (Cold-Chain Insulated)',
            plateNo: 'LAG-744-EKY'
          },
          pharmacistVerificationNote: orderDetails.teleconferenceFee > 0
            ? 'Prescription safety audit registered. Pharmacist teleconference scheduled.'
            : 'OTC Order verified. Sealed with tamper-evident Curadeck hologram.'
        };

        // 2. Persist to Firestore Live Database
        try {
          await createLiveOrderOrRequest({
            referenceNo: orderNum,
            type: 'drug_order',
            status: 'pending',
            patientName: newOrder.patientName,
            patientEmail: currentUser?.email || 'customer@curadeck.ng',
            patientPhone: newOrder.patientPhone,
            deliveryAddress: orderDetails.deliveryAddress,
            deliveryCity: newOrder.deliveryCity,
            deliveryState: orderDetails.deliveryState,
            total: orderDetails.total,
            itemsSummary: cartItems.map(i => `${i.quantity}x ${i.medicine.name}`).join(', '),
            paymentMethod: 'paystack_card',
            paymentReference,
            notes: `Delivery speed: ${orderDetails.deliverySpeed}`,
            createdAt: new Date().toISOString()
          });
          syncLiveData();
        } catch (dbErr) {
          console.error('Failed writing order to Firestore:', dbErr);
        }

        setOrders(prev => [newOrder, ...prev]);
        setCartItems([]);
        setPaystackConfig(prev => ({ ...prev, isOpen: false }));
        setActiveTab('orders');
        addToast('success', 'Order Confirmed via Paystack!', `Order #${newOrder.orderNumber} is dispatched to fulfillment.`);
      }
    });
  };

  // Submit New Custom Drug Quote -> Writes to Firestore
  const handleSubmitNewQuote = async (newQuoteData: Omit<QuoteRequest, 'id' | 'referenceNo' | 'createdAt'>) => {
    const refNum = 'CD-QT-' + Math.floor(10000 + Math.random() * 90000);
    const newQuote: QuoteRequest = {
      ...newQuoteData,
      id: 'quote_' + Date.now(),
      referenceNo: refNum,
      createdAt: 'Just now',
    };

    setQuotes(prev => [newQuote, ...prev]);

    try {
      await createLiveOrderOrRequest({
        referenceNo: refNum,
        type: 'prescription_quote',
        status: 'pending',
        patientName: newQuoteData.patientName,
        patientEmail: newQuoteData.patientEmail,
        patientPhone: newQuoteData.patientPhone,
        deliveryAddress: newQuoteData.deliveryAddress,
        deliveryCity: newQuoteData.deliveryCity,
        deliveryState: newQuoteData.deliveryState,
        total: newQuoteData.total || 0,
        itemsSummary: newQuoteData.fileName ? `Uploaded Prescription: ${newQuoteData.fileName}` : (newQuoteData.rawText || 'Prescription items'),
        prescriptionFileUrl: newQuoteData.fileUrl,
        rawText: newQuoteData.rawText,
        notes: newQuoteData.notes,
        createdAt: new Date().toISOString()
      });
      syncLiveData();
    } catch (err) {
      console.error('Failed writing quote to Firestore:', err);
    }

    addToast(
      'success',
      `Quote Request ${newQuote.referenceNo} Received`,
      'Assigned to Clinical Pharmacist on duty. You will receive pricing within 30-120 minutes.'
    );
  };

  // Pay ₦500 Teleconference Fee
  const handlePayTeleconference = (quote: QuoteRequest) => {
    setPaystackConfig({
      isOpen: true,
      amount: 500,
      title: 'Curadeck Pharmacist Teleconference',
      purpose: `PCN Mandatory Safety Clearance for Quote ${quote.referenceNo}`,
      onSuccess: (ref) => {
        setQuotes(prev => prev.map(q => 
          q.id === quote.id ? { ...q, teleconferencePaid: true, status: 'quote_ready' } : q
        ));
        setPaystackConfig(prev => ({ ...prev, isOpen: false }));
        addToast('success', '₦500 Teleconference Paid!', 'You can now launch the video call with the clinical pharmacist.');
      }
    });
  };

  // Pay Full Quote
  const handlePayQuoteFull = (quote: QuoteRequest) => {
    setPaystackConfig({
      isOpen: true,
      amount: quote.total,
      title: 'Curadeck Custom Medication Fulfillment',
      purpose: `Full payment for Quote ${quote.referenceNo}`,
      onSuccess: (paymentReference) => {
        setQuotes(prev => prev.map(q => 
          q.id === quote.id ? { ...q, status: 'paid' } : q
        ));

        const newOrder: Order = {
          id: 'ord_' + Date.now(),
          orderNumber: 'CURA-' + Math.floor(10000 + Math.random() * 90000),
          items: quote.itemsQuoted.map(i => ({
            name: i.name,
            price: i.unitPrice,
            quantity: i.qty,
            isPrescription: i.isPrescription
          })),
          subtotal: quote.subtotal,
          teleconferenceFee: quote.teleconferenceFee,
          deliveryFee: quote.deliveryFee,
          discount: 0,
          total: quote.total,
          patientName: quote.patientName,
          patientPhone: quote.patientPhone,
          deliveryAddress: quote.deliveryAddress,
          deliveryCity: quote.deliveryCity,
          deliveryState: quote.deliveryState,
          paymentMethod: 'paystack_card',
          paymentReference,
          createdAt: new Date().toLocaleDateString(),
          status: 'confirmed',
          estimatedDelivery: 'Within 3 hours',
          rider: {
            name: 'Segun Ogundipe',
            phone: '+234 809 112 2334',
            bikeModel: 'Bajaj Boxer 150cc',
            plateNo: 'KJA-203-APP'
          },
          pharmacistVerificationNote: 'Prescription teleconference completed and clinically signed off.'
        };

        setOrders(prev => [newOrder, ...prev]);
        setPaystackConfig(prev => ({ ...prev, isOpen: false }));
        setActiveTab('orders');
        addToast('success', 'Quote Order Paid & Dispatched!', `Order #${newOrder.orderNumber} is on its way.`);
      }
    });
  };

  // Clear Prescription from Teleconference
  const handleClearPrescription = (quoteId: string) => {
    setQuotes(prev => prev.map(q => 
      q.id === quoteId ? { ...q, teleconferenceCompleted: true, status: 'pharmacist_approved' } : q
    ));
    addToast('success', 'Prescription Cleared by Pharmacist!', 'Order is clinically approved for immediate fulfillment.');
  };

  // Book Consultation Success -> Writes to Firestore
  const handleConsultationSuccess = (details: {
    specialist: ConsultationSpecialist;
    slot: string;
    channel: string;
    reason: string;
    fee: number;
  }) => {
    setSelectedSpecialist(null);
    setPaystackConfig({
      isOpen: true,
      amount: details.fee,
      title: 'Curadeck Specialist Teleconsultation',
      purpose: `Consultation with ${details.specialist.name} (${details.slot})`,
      onSuccess: async (ref) => {
        try {
          await createLiveOrderOrRequest({
            referenceNo: 'CONS-' + Math.floor(10000 + Math.random() * 90000),
            type: 'teleconsultation',
            status: 'approved',
            patientName: currentUser?.name || 'Patient',
            patientEmail: currentUser?.email || 'patient@curadeck.ng',
            patientPhone: currentUser?.phone || '+234 800 000 0000',
            total: details.fee,
            itemsSummary: `Doctor Teleconsultation with ${details.specialist.name} (${details.specialist.specialty})`,
            paymentMethod: 'paystack_card',
            paymentReference: ref,
            notes: `Slot: ${details.slot} | Channel: ${details.channel} | Reason: ${details.reason}`,
            createdAt: new Date().toISOString()
          });
          syncLiveData();
        } catch (err) {
          console.error('Failed writing consultation to Firestore:', err);
        }

        setPaystackConfig(prev => ({ ...prev, isOpen: false }));
        addToast(
          'success',
          'Teleconsultation Confirmed!',
          `Appointment with ${details.specialist.name} scheduled for ${details.slot}. A meeting link has been sent via SMS.`
        );
      }
    });
  };

  // Hire Nurse Success -> Writes to Firestore
  const handleNurseHireSuccess = (details: {
    nurse: CareNurse;
    shiftType: string;
    daysCount: number;
    startDate: string;
    patientCondition: string;
    locationState: string;
    locationAddress: string;
    totalAmount: number;
  }) => {
    setSelectedNurse(null);
    setPaystackConfig({
      isOpen: true,
      amount: details.totalAmount,
      title: 'Curadeck Care Nurse Booking',
      purpose: `${details.daysCount} days of ${details.shiftType} by ${details.nurse.name}`,
      onSuccess: async (ref) => {
        try {
          await createLiveOrderOrRequest({
            referenceNo: 'NURSE-' + Math.floor(10000 + Math.random() * 90000),
            type: 'care_nurse',
            status: 'approved',
            patientName: currentUser?.name || 'Patient Family',
            patientEmail: currentUser?.email || 'patient@curadeck.ng',
            patientPhone: currentUser?.phone || '+234 800 000 0000',
            deliveryAddress: details.locationAddress,
            deliveryState: details.locationState,
            total: details.totalAmount,
            itemsSummary: `${details.nurse.name} (${details.daysCount} days, ${details.shiftType} shift)`,
            paymentMethod: 'paystack_card',
            paymentReference: ref,
            notes: `Condition: ${details.patientCondition} | Start: ${details.startDate}`,
            createdAt: new Date().toISOString()
          });
          syncLiveData();
        } catch (err) {
          console.error('Failed writing nurse booking to Firestore:', err);
        }

        setPaystackConfig(prev => ({ ...prev, isOpen: false }));
        addToast(
          'success',
          'Care Nurse Booked Successfully!',
          `${details.nurse.name} has been notified and will arrive at ${details.locationAddress} on ${details.startDate}.`
        );
      }
    });
  };

  const isStaffOrAdmin = currentUser?.role === 'admin' || currentUser?.role === 'pharmacist';

  // Guard: Automatically return to customer view if unauthorized user tries to access admin-hub
  useEffect(() => {
    if (!isStaffOrAdmin && (activeTab === 'admin-hub' || activeTab === 'pharmacist-portal')) {
      setActiveTab('chat');
    }
  }, [isStaffOrAdmin, activeTab]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      
      {/* Top Navbar & Mobile Bottom Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartItems={cartItems}
        setIsCartOpen={setIsCartOpen}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        pendingRequestsCount={pendingRequestsCount}
      />

      {/* Main Content Router */}
      <main className="flex-1 pb-24 lg:pb-12">
        {/* Chatbot Landing Experience */}
        {activeTab === 'chat' && (
          <ChatLandingView
            onNavigateToMarket={() => setActiveTab('market')}
            onNavigateToConsultations={() => setActiveTab('consultations')}
            onNavigateToUploadQuote={() => setActiveTab('upload-quote')}
            onNavigateToNurses={() => setActiveTab('care-nurses')}
            medicines={liveMedications}
          />
        )}

        {/* Direct Market Floor */}
        {(activeTab === 'market' || activeTab === 'home' || activeTab === 'shop') && (
          <MarketFloorView
            onSelectMedicine={(med) => setSelectedMedicine(med)}
            onAddToCart={handleAddToCart}
            onUpdateQuantity={handleUpdateQuantity}
            cartItems={cartItems}
            onOpenUploadQuote={() => setActiveTab('upload-quote')}
            onOpenConsultations={() => setActiveTab('consultations')}
            onOpenNurses={() => setActiveTab('care-nurses')}
            onOpenCart={() => setIsCartOpen(true)}
            medicines={liveMedications}
          />
        )}

        {/* Upload Prescription & Custom Quotes */}
        {activeTab === 'upload-quote' && (
          <UploadQuoteView
            quotes={quotes}
            onSubmitNewQuote={handleSubmitNewQuote}
            onOpenTeleconference={(q) => setTeleconferenceQuote(q)}
            onPayTeleconference={handlePayTeleconference}
            onPayQuoteFull={handlePayQuoteFull}
            currentUser={currentUser}
          />
        )}

        {/* Consult Doctor */}
        {activeTab === 'consultations' && (
          <ConsultationsView
            onSelectSpecialist={(spec) => setSelectedSpecialist(spec)}
          />
        )}

        {/* Care Nurses */}
        {activeTab === 'care-nurses' && (
          <CareNursesView
            onSelectNurse={(nurse) => setSelectedNurse(nurse)}
          />
        )}

        {/* Track Orders */}
        {activeTab === 'orders' && (
          <OrderTrackingView
            orders={orders}
            onOpenShop={() => setActiveTab('market')}
          />
        )}

        {/* Production Operations Hub & Admin Portal - Only accessible when logged in as admin */}
        {isStaffOrAdmin && (activeTab === 'admin-hub' || activeTab === 'pharmacist-portal') && (
          <AdminManagementView
            currentUser={currentUser!}
            onOpenShop={() => setActiveTab('market')}
            onShowToast={addToast}
            onMedicationsUpdated={syncLiveData}
          />
        )}
      </main>

      {/* Footer */}
      {activeTab !== 'chat' && <Footer setActiveTab={setActiveTab} />}

      {/* Floating Concierge / Chatbot Launcher */}
      {activeTab !== 'chat' && (
        <button
          onClick={() => setActiveTab('chat')}
          className="fixed bottom-20 lg:bottom-6 right-4 z-30 flex items-center gap-2 bg-gradient-to-r from-teal-800 to-slate-900 hover:from-teal-700 hover:to-slate-800 text-white px-3.5 py-2.5 rounded-full shadow-lg border border-teal-600/40 cursor-pointer active:scale-95 transition-all group"
          aria-label="Open Curadeck Chatbot Concierge"
        >
          <div className="w-6 h-6 rounded-full bg-teal-500/30 flex items-center justify-center text-teal-300 group-hover:scale-110 transition-transform">
            <MessageSquareHeart className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold pr-1 hidden xs:inline">
            Curadeck Concierge
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </button>
      )}

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onProceedToCheckout={handleProceedToCheckout}
        currentUser={currentUser}
      />

      {/* Medicine Details Modal */}
      <MedicineDetailModal
        medicine={selectedMedicine}
        onClose={() => setSelectedMedicine(null)}
        onAddToCart={handleAddToCart}
        isInCart={selectedMedicine ? cartItems.some(i => i.medicine.id === selectedMedicine.id) : false}
      />

      {/* Consultation Booking Modal */}
      <ConsultationBookingModal
        specialist={selectedSpecialist}
        onClose={() => setSelectedSpecialist(null)}
        onBookSuccess={handleConsultationSuccess}
        currentUser={currentUser}
      />

      {/* Care Nurse Booking Modal */}
      <CareNurseHireModal
        nurse={selectedNurse}
        onClose={() => setSelectedNurse(null)}
        onHireSuccess={handleNurseHireSuccess}
        currentUser={currentUser}
      />

      {/* Pharmacist Teleconference Video Room */}
      <TeleconferenceRoomModal
        isOpen={!!teleconferenceQuote}
        onClose={() => setTeleconferenceQuote(null)}
        quote={teleconferenceQuote}
        onClearPrescription={handleClearPrescription}
        isPharmacistUser={currentUser?.role === 'pharmacist' || currentUser?.role === 'admin'}
      />

      {/* Paystack Payment Modal */}
      <PaystackModal
        isOpen={paystackConfig.isOpen}
        onClose={() => setPaystackConfig(prev => ({ ...prev, isOpen: false }))}
        amount={paystackConfig.amount}
        customerEmail={currentUser?.email || 'patient@curadeck.ng'}
        customerName={currentUser?.name || 'Customer'}
        title={paystackConfig.title}
        purpose={paystackConfig.purpose}
        onSuccess={paystackConfig.onSuccess}
      />

      {/* User Login & Registration Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          addToast('success', `Welcome, ${user.name}!`);
        }}
        onShowToast={addToast}
      />

      {/* Toast Notification Manager */}
      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
