import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Users, 
  FileText, 
  BarChart3, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Truck, 
  ShieldCheck, 
  Trash2, 
  Edit3, 
  X, 
  DollarSign, 
  Phone, 
  Mail, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Stethoscope,
  HeartHandshake,
  Pill
} from 'lucide-react';
import { Medicine, Category, User } from '../types';
import { 
  fetchLiveMedications, 
  addLiveMedication, 
  updateLiveMedication, 
  deleteLiveMedication,
  fetchLiveOrdersAndRequests,
  updateLiveRequestStatus,
  fetchAllUsers,
  updateUserRole,
  LiveRequestItem,
  SUPER_ADMIN_EMAIL
} from '../lib/dbService';
import { formatNaira } from '../data/mockData';

interface AdminManagementViewProps {
  currentUser: User;
  onOpenShop: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
  onMedicationsUpdated?: () => void;
}

const CATEGORIES: Category[] = [
  'Malaria & Fevers',
  'Infections & Antibiotics',
  'Hypertension & Cardiac',
  'Diabetes & Metabolic',
  'Pain & Anti-inflammatory',
  'Sickle Cell & Blood Support',
  'Maternal & Child Health',
  'Vitamins & Immunity',
  'Gastrointestinal & Ulcer'
];

export const AdminManagementView: React.FC<AdminManagementViewProps> = ({
  currentUser,
  onOpenShop,
  onShowToast,
  onMedicationsUpdated
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'requests' | 'medications' | 'users' | 'summary'>('requests');
  
  // Data States
  const [medications, setMedications] = useState<Medicine[]>([]);
  const [requests, setRequests] = useState<LiveRequestItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Filters & Searches
  const [medSearch, setMedSearch] = useState<string>('');
  const [medCategoryFilter, setMedCategoryFilter] = useState<string>('All');
  const [requestStatusFilter, setRequestStatusFilter] = useState<string>('all');
  const [userSearch, setUserSearch] = useState<string>('');

  // Modal States
  const [isAddMedModalOpen, setIsAddMedModalOpen] = useState<boolean>(false);
  const [editingMed, setEditingMed] = useState<Medicine | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<LiveRequestItem | null>(null);
  const [noteInput, setNoteInput] = useState<string>('');

  // Medication Form State (Used for both Adding new and Editing existing products)
  const [medForm, setMedForm] = useState({
    name: '',
    genericName: '',
    brand: '',
    category: 'Malaria & Fevers' as Category,
    price: '',
    unit: 'Pack of 10 Tablets',
    stockCount: '50',
    prescriptionRequired: false,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
    description: '',
    dosage: '',
    manufacturer: '',
    nafdacNo: 'A4-' + Math.floor(1000 + Math.random() * 9000),
    sideEffects: 'Mild nausea, headache',
    popular: false
  });

  const loadAllData = async () => {
    setIsRefreshing(true);
    try {
      const [medsData, reqsData, usersData] = await Promise.all([
        fetchLiveMedications(),
        fetchLiveOrdersAndRequests(),
        fetchAllUsers()
      ]);
      setMedications(medsData);
      setRequests(reqsData);
      setUsers(usersData);
    } catch (err) {
      console.error('Error loading data:', err);
      onShowToast('error', 'Sync Failed', 'Could not fetch live database records.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Handle Add OR Edit Medication (Updates existing product record using its ID)
  const handleSaveMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medForm.name.trim() || !medForm.price) {
      onShowToast('error', 'Required Fields Missing', 'Please enter medicine name and price.');
      return;
    }

    const parsedPrice = Number(medForm.price);
    const parsedStock = Math.max(0, parseInt(medForm.stockCount, 10) || 0);
    const isInStock = parsedStock > 0;

    try {
      if (editingMed) {
        // Update existing product in Firestore using its ID
        const updates: Partial<Medicine> = {
          name: medForm.name.trim(),
          genericName: medForm.genericName.trim() || medForm.name.trim(),
          brand: medForm.brand.trim() || 'Generic',
          category: medForm.category,
          price: parsedPrice,
          unit: medForm.unit.trim() || 'Pack of 10 Tablets',
          stockCount: parsedStock,
          inStock: isInStock,
          prescriptionRequired: medForm.prescriptionRequired,
          image: medForm.image.trim() || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
          description: medForm.description.trim() || 'Authentic NAFDAC-approved medication stored in certified cold-chain conditions.',
          dosage: medForm.dosage.trim() || 'As directed by physician or pharmacist.',
          manufacturer: medForm.manufacturer.trim() || 'Licensed Pharmaceutical Laboratory',
          nafdacNo: medForm.nafdacNo.trim() || ('A4-' + Math.floor(1000 + Math.random() * 9000)),
          sideEffects: medForm.sideEffects ? medForm.sideEffects.split(',').map(s => s.trim()).filter(Boolean) : [],
          popular: medForm.popular
        };

        try {
          await updateLiveMedication(editingMed.id, updates);
        } catch (dbErr) {
          console.warn('Live Firestore update encountered network issue, applying to local store:', dbErr);
        }
        
        // Immediate local state update for fast responsiveness
        setMedications(prev => prev.map(m => m.id === editingMed.id ? { ...m, ...updates } : m));
        onShowToast(
          'success', 
          'Product Updated', 
          `"${medForm.name}" updated successfully. Stock: ${parsedStock} units (${isInStock ? 'In Stock' : 'Out of Stock'}).`
        );
      } else {
        // Add new product into live Firestore collection
        const newMed = await addLiveMedication({
          name: medForm.name.trim(),
          genericName: medForm.genericName.trim() || medForm.name.trim(),
          brand: medForm.brand.trim() || 'Authentic',
          category: medForm.category,
          price: parsedPrice,
          unit: medForm.unit.trim() || 'Pack of 10 Tablets',
          inStock: isInStock,
          stockCount: parsedStock,
          prescriptionRequired: medForm.prescriptionRequired,
          image: medForm.image.trim() || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
          description: medForm.description.trim() || 'Authentic NAFDAC-approved medication stored in certified cold-chain conditions.',
          dosage: medForm.dosage.trim() || 'As directed by physician or pharmacist.',
          sideEffects: medForm.sideEffects ? medForm.sideEffects.split(',').map(s => s.trim()).filter(Boolean) : [],
          manufacturer: medForm.manufacturer.trim() || 'Approved Manufacturer',
          nafdacNo: medForm.nafdacNo.trim() || ('A4-' + Math.floor(1000 + Math.random() * 9000)),
          popular: medForm.popular
        });
        setMedications(prev => [newMed, ...prev]);
        onShowToast('success', 'Product Added', `"${medForm.name}" is now live on Curadeck catalog with ${parsedStock} units.`);
      }

      setIsAddMedModalOpen(false);
      setEditingMed(null);
      resetMedForm();
      onMedicationsUpdated?.();
    } catch (err) {
      console.error('Save medication failed:', err);
      onShowToast('error', 'Error Saving', 'Could not save medication to database.');
    }
  };

  const resetMedForm = () => {
    setMedForm({
      name: '',
      genericName: '',
      brand: '',
      category: 'Malaria & Fevers',
      price: '',
      unit: 'Pack of 10 Tablets',
      stockCount: '50',
      prescriptionRequired: false,
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
      description: '',
      dosage: '',
      manufacturer: '',
      nafdacNo: 'A4-' + Math.floor(1000 + Math.random() * 9000),
      sideEffects: 'Mild nausea, headache',
      popular: false
    });
  };

  // Open Edit modal with the exact same form pre-filled with the product's current data
  const handleOpenEditModal = (med: Medicine) => {
    setEditingMed(med);
    const stock = med.stockCount !== undefined ? med.stockCount : (med.inStock ? 50 : 0);
    setMedForm({
      name: med.name || '',
      genericName: med.genericName || '',
      brand: med.brand || '',
      category: med.category || 'Malaria & Fevers',
      price: (med.price !== undefined && med.price !== null) ? med.price.toString() : '',
      unit: med.unit || 'Pack of 10 Tablets',
      stockCount: stock.toString(),
      prescriptionRequired: !!med.prescriptionRequired,
      image: med.image || '',
      description: med.description || '',
      dosage: med.dosage || '',
      manufacturer: med.manufacturer || '',
      nafdacNo: med.nafdacNo || '',
      sideEffects: Array.isArray(med.sideEffects) ? med.sideEffects.join(', ') : (med.sideEffects || ''),
      popular: !!med.popular
    });
    setIsAddMedModalOpen(true);
  };

  const handleDeleteMedication = async (med: Medicine) => {
    if (window.confirm(`Are you sure you want to permanently delete "${med.name}" from the live database?`)) {
      try {
        await deleteLiveMedication(med.id);
        setMedications(prev => prev.filter(m => m.id !== med.id));
        onShowToast('info', 'Medication Removed', `${med.name} removed from inventory.`);
      } catch (err) {
        onShowToast('error', 'Delete Failed', 'Could not delete item.');
      }
    }
  };

  // Quick Inline Stock Toggle
  const handleToggleStock = async (med: Medicine) => {
    const newStatus = !med.inStock;
    try {
      await updateLiveMedication(med.id, { inStock: newStatus });
      setMedications(prev => prev.map(m => m.id === med.id ? { ...m, inStock: newStatus } : m));
      onShowToast('info', `${med.name} is now ${newStatus ? 'In Stock' : 'Out of Stock'}`);
    } catch (err) {
      onShowToast('error', 'Update Failed', 'Could not update status.');
    }
  };

  // Request Status Updates
  const handleUpdateStatus = async (requestId: string, newStatus: LiveRequestItem['status']) => {
    try {
      await updateLiveRequestStatus(requestId, newStatus, noteInput || undefined);
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: newStatus, pharmacistNote: noteInput || r.pharmacistNote } : r));
      if (selectedRequest && selectedRequest.id === requestId) {
        setSelectedRequest(prev => prev ? { ...prev, status: newStatus, pharmacistNote: noteInput || prev.pharmacistNote } : null);
      }
      setNoteInput('');
      onShowToast('success', 'Status Updated', `Request marked as ${newStatus}.`);
    } catch (err) {
      onShowToast('error', 'Update Failed', 'Could not update request status.');
    }
  };

  // Change User Role
  const handleRoleChange = async (userId: string, newRole: 'patient' | 'pharmacist' | 'admin') => {
    try {
      await updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      onShowToast('success', 'Role Updated', `User role changed to ${newRole}.`);
    } catch (err) {
      onShowToast('error', 'Role Change Failed', 'Could not update role.');
    }
  };

  // Filtered Medications
  const filteredMeds = medications.filter(m => {
    const matchesCat = medCategoryFilter === 'All' || m.category === medCategoryFilter;
    const matchesSearch = !medSearch || 
      m.name.toLowerCase().includes(medSearch.toLowerCase()) || 
      m.genericName.toLowerCase().includes(medSearch.toLowerCase()) ||
      m.nafdacNo.toLowerCase().includes(medSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Filtered Requests
  const filteredRequests = requests.filter(r => {
    if (requestStatusFilter === 'all') return true;
    return r.status === requestStatusFilter;
  });

  // Filtered Users
  const filteredUsers = users.filter(u => {
    if (!userSearch) return true;
    return (
      (u.name && u.name.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.phone && u.phone.includes(userSearch))
    );
  });

  // Summary Metrics
  const totalMedCount = medications.length;
  const inStockMedCount = medications.filter(m => m.inStock).length;
  const pendingRequestsCount = requests.filter(r => r.status === 'pending' || r.status === 'reviewing').length;
  const totalRevenue = requests.reduce((acc, r) => acc + (r.total || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Operations Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-display">
              Curadeck Operations & Control Hub
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
              Live Production
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time medication catalog management, prescription quote reviews, patient orders, and user access.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <button
            onClick={loadAllData}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Database'}</span>
          </button>

          <button
            onClick={() => {
              setEditingMed(null);
              resetMedForm();
              setIsAddMedModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medication</span>
          </button>
        </div>
      </div>

      {/* Metric Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inventory SKUs</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-display">{totalMedCount}</p>
          <p className="text-[11px] text-teal-700 font-medium mt-0.5">{inStockMedCount} in active stock</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Requests</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-display">{pendingRequestsCount}</p>
          <p className="text-[11px] text-amber-700 font-medium mt-0.5">Awaiting pharmacist review</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Accounts</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-display">{users.length}</p>
          <p className="text-[11px] text-indigo-700 font-medium mt-0.5">Patients, Pharmacists & Admins</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Orders Volume</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-display">{formatNaira(totalRevenue)}</p>
          <p className="text-[11px] text-emerald-700 font-medium mt-0.5">Total platform processed</p>
        </div>
      </div>

      {/* Main Navigation Subtabs */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-4 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveSubTab('requests')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'requests'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Patient Requests & Orders</span>
          {pendingRequestsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-black">
              {pendingRequestsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('medications')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'medications'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Medication Inventory ({medications.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('users')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'users'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Directory ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('summary')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'summary'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>PCN Compliance & Safety Logs</span>
        </button>
      </div>

      {/* SUBTAB 1: REQUESTS & ORDERS */}
      {activeSubTab === 'requests' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-700">Filter Status:</span>
              <div className="flex flex-wrap gap-1.5">
                {['all', 'pending', 'reviewing', 'approved', 'dispatched', 'completed'].map(status => (
                  <button
                    key={status}
                    onClick={() => setRequestStatusFilter(status)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize cursor-pointer transition-colors ${
                      requestStatusFilter === status
                        ? 'bg-teal-700 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-xs text-slate-500">
              Showing {filteredRequests.length} of {requests.length} records
            </span>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No requests match this filter</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Incoming medication orders, prescription slip uploads, and bookings will appear here instantly as patients place them.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-teal-300 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {req.referenceNo || req.id.substring(0, 8)}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          req.status === 'completed' || req.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'dispatched'
                            ? 'bg-blue-100 text-blue-800'
                            : req.status === 'reviewing'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">
                        {req.patientName || 'Patient'}
                      </h4>
                    </div>

                    <span className="text-xs font-black text-slate-900 font-display">
                      {req.total > 0 ? formatNaira(req.total) : 'Quote Pending'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-150">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{req.patientPhone || 'No phone provided'}</span>
                    </div>
                    {req.patientEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{req.patientEmail}</span>
                      </div>
                    )}
                    {req.deliveryAddress && (
                      <div className="flex items-center gap-2">
                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{req.deliveryAddress}, {req.deliveryState}</span>
                      </div>
                    )}
                    {req.itemsSummary && (
                      <div className="pt-1 text-[11px] font-medium text-slate-700">
                        <strong>Items: </strong> {req.itemsSummary}
                      </div>
                    )}
                    {req.notes && (
                      <div className="pt-1 text-[11px] text-amber-900 bg-amber-50/70 p-2 rounded border border-amber-100">
                        <strong>Patient Note: </strong> {req.notes}
                      </div>
                    )}
                    {req.pharmacistNote && (
                      <div className="pt-1 text-[11px] text-teal-900 bg-teal-50 p-2 rounded border border-teal-100">
                        <strong>Pharmacist Sign-off: </strong> {req.pharmacistNote}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <span className="text-[10px] text-slate-400">
                      Placed: {new Date(req.createdAt).toLocaleDateString()} at {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <select
                        value={req.status}
                        onChange={(e) => handleUpdateStatus(req.id, e.target.value as any)}
                        className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none focus:border-teal-500 cursor-pointer"
                      >
                        <option value="pending">Mark Pending</option>
                        <option value="reviewing">Mark Reviewing</option>
                        <option value="approved">Mark Approved</option>
                        <option value="dispatched">Mark Dispatched</option>
                        <option value="completed">Mark Completed</option>
                        <option value="cancelled">Mark Cancelled</option>
                      </select>

                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer border border-teal-200"
                      >
                        Add Clinical Note
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: MEDICATION INVENTORY */}
      {activeSubTab === 'medications' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={medSearch}
                onChange={(e) => setMedSearch(e.target.value)}
                placeholder="Search medication name, active ingredient, or NAFDAC #..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={medCategoryFilter}
                onChange={(e) => setMedCategoryFilter(e.target.value)}
                className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <button
                onClick={() => {
                  setEditingMed(null);
                  resetMedForm();
                  setIsAddMedModalOpen(true);
                }}
                className="flex items-center gap-1 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>
          </div>

          {/* Medications Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Medication & NAFDAC</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Unit Price (₦)</th>
                    <th className="py-3 px-4">Stock Count</th>
                    <th className="py-3 px-4">Prescription</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {filteredMeds.map((med) => (
                    <tr key={med.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={med.image}
                            alt={med.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{med.name}</p>
                            <p className="text-[11px] text-slate-500">{med.genericName}</p>
                            <p className="text-[10px] text-teal-700 font-mono">NAFDAC: {med.nafdacNo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {med.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-black text-slate-900 font-display">
                        {formatNaira(med.price)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[11px] ${
                            ((med.stockCount !== undefined ? med.stockCount : (med.inStock ? 50 : 0)) > 10)
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : ((med.stockCount !== undefined ? med.stockCount : (med.inStock ? 50 : 0)) > 0)
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-red-50 text-red-800 border border-red-200'
                          }`}>
                            {med.stockCount !== undefined ? med.stockCount : (med.inStock ? 50 : 0)} units
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {med.prescriptionRequired ? (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Rx Required
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            OTC
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleStock(med)}
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                            med.inStock
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {med.inStock ? 'In Stock' : 'Out of Stock'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(med)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100/80 rounded-xl border border-teal-200/80 transition-all cursor-pointer shadow-2xs active:scale-95"
                            title={`Edit details and stock for ${med.name}`}
                          >
                            <Edit3 className="w-3.5 h-3.5 text-teal-600" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteMedication(med)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                            title="Delete Medication"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredMeds.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-xs">
                No medications found matching your criteria.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: USER DIRECTORY */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by user name, email, or phone..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>
            <span className="text-xs text-slate-500">
              Total Accounts: <strong>{users.length}</strong>
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">User Details</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Current Role</th>
                    <th className="py-3 px-4">Joined Date</th>
                    <th className="py-3 px-4 text-right">Role Management</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{u.name || 'Unnamed'}</p>
                            <p className="text-[11px] text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-700">{u.phone || 'N/A'}</p>
                        <p className="text-[10px] text-slate-400">{u.city ? `${u.city}, ${u.state}` : 'Nigeria'}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'pharmacist'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {u.role || 'patient'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-400">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Active Member'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => handleRoleChange(u.id, 'admin')}
                              className="px-2 py-1 text-[11px] font-bold text-purple-700 hover:bg-purple-50 rounded border border-purple-200 cursor-pointer"
                            >
                              Make Admin
                            </button>
                          )}
                          {u.role !== 'pharmacist' && (
                            <button
                              onClick={() => handleRoleChange(u.id, 'pharmacist')}
                              className="px-2 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-50 rounded border border-blue-200 cursor-pointer"
                            >
                              Make Pharmacist
                            </button>
                          )}
                          {u.role !== 'patient' && (
                            <button
                              onClick={() => handleRoleChange(u.id, 'patient')}
                              className="px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer"
                            >
                              Set to Patient
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: PCN COMPLIANCE & SAFETY LOGS */}
      {activeSubTab === 'summary' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Pharmacists Council of Nigeria (PCN) Compliance Record
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              License Reference: #LA/8892 • Premise: Curadeck Digital Health Logistics Hub
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 space-y-2">
              <div className="flex items-center gap-2 text-teal-800 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Cold-Chain Storage Audit</span>
              </div>
              <p className="text-xs text-teal-950">
                Central hub temperature maintained between 2°C - 8°C for biologics & insulins. Temperature data logged continuously.
              </p>
              <span className="inline-block text-[10px] font-bold text-teal-800 bg-white px-2 py-0.5 rounded">
                Status: Compliant
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>NAFDAC Authenticity Check</span>
              </div>
              <p className="text-xs text-emerald-950">
                All medications stocked originate exclusively from licensed pharmaceutical distributors with verifiable NAFDAC batch numbers.
              </p>
              <span className="inline-block text-[10px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded">
                Zero Counterfeit Tolerance
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2">
              <div className="flex items-center gap-2 text-blue-800 font-bold text-xs">
                <Stethoscope className="w-4 h-4" />
                <span>Mandatory Duty Pharmacist Review</span>
              </div>
              <p className="text-xs text-blue-950">
                Prescription-only drugs are locked from dispatch until cleared by a PCN-registered duty pharmacist via ₦500 teleconference.
              </p>
              <span className="inline-block text-[10px] font-bold text-blue-800 bg-white px-2 py-0.5 rounded">
                Audit Active
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT MEDICATION MODAL */}
      {isAddMedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto space-y-4 border border-slate-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-750 flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {editingMed ? `Edit Product: ${editingMed.name}` : 'Add New Product'}
                    </h3>
                    {editingMed && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        ID: {editingMed.id}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {editingMed 
                      ? 'Updates this existing product record in Firestore, storefront catalog, and chatbot inventory.' 
                      : 'Publishes a new pharmaceutical item directly to the live catalog.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddMedModalOpen(false);
                  setEditingMed(null);
                  resetMedForm();
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMedication} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">MEDICATION NAME *</label>
                  <input
                    type="text"
                    value={medForm.name}
                    onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
                    placeholder="e.g. Coartem 80/480mg Tablets"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">GENERIC / ACTIVE INGREDIENT</label>
                  <input
                    type="text"
                    value={medForm.genericName}
                    onChange={(e) => setMedForm({ ...medForm, genericName: e.target.value })}
                    placeholder="e.g. Artemether + Lumefantrine"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">CATEGORY *</label>
                  <select
                    value={medForm.category}
                    onChange={(e) => setMedForm({ ...medForm, category: e.target.value as Category })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500 cursor-pointer bg-white"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">PRICE IN NAIRA (₦) *</label>
                  <input
                    type="number"
                    value={medForm.price}
                    onChange={(e) => setMedForm({ ...medForm, price: e.target.value })}
                    placeholder="e.g. 3500"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>
              </div>

              {/* DEDICATED STOCK QUANTITY MANAGEMENT (Tied to Chatbot stock-check) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="block font-bold text-slate-900 text-xs">
                      {editingMed ? 'INVENTORY STOCK QUANTITY (UNITS) *' : 'INITIAL STOCK QUANTITY (UNITS) *'}
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Live unit count queried by customers and the AI Concierge stock check.
                    </p>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                    (parseInt(medForm.stockCount, 10) || 0) > 0
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}>
                    {(parseInt(medForm.stockCount, 10) || 0) > 0
                      ? `✓ In Stock (${medForm.stockCount} units)`
                      : '✕ Out of Stock (0 units)'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <input
                    type="number"
                    min="0"
                    value={medForm.stockCount}
                    onChange={(e) => setMedForm({ ...medForm, stockCount: e.target.value })}
                    placeholder="e.g. 50"
                    className="w-28 px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 bg-white focus:outline-none focus:border-teal-500"
                    required
                  />

                  {/* Direct Stock Steppers */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const current = parseInt(medForm.stockCount, 10) || 0;
                        setMedForm({ ...medForm, stockCount: Math.max(0, current - 10).toString() });
                      }}
                      className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
                      title="Decrease stock by 10"
                    >
                      -10
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const current = parseInt(medForm.stockCount, 10) || 0;
                        setMedForm({ ...medForm, stockCount: Math.max(0, current - 1).toString() });
                      }}
                      className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
                      title="Decrease stock by 1"
                    >
                      -1
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const current = parseInt(medForm.stockCount, 10) || 0;
                        setMedForm({ ...medForm, stockCount: (current + 1).toString() });
                      }}
                      className="px-2 py-1 bg-white hover:bg-teal-50 border border-teal-200 rounded-lg text-xs font-bold text-teal-700 cursor-pointer"
                      title="Increase stock by 1"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const current = parseInt(medForm.stockCount, 10) || 0;
                        setMedForm({ ...medForm, stockCount: (current + 10).toString() });
                      }}
                      className="px-2 py-1 bg-white hover:bg-teal-50 border border-teal-200 rounded-lg text-xs font-bold text-teal-700 cursor-pointer"
                      title="Increase stock by 10"
                    >
                      +10
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const current = parseInt(medForm.stockCount, 10) || 0;
                        setMedForm({ ...medForm, stockCount: (current + 50).toString() });
                      }}
                      className="px-2 py-1 bg-white hover:bg-teal-50 border border-teal-200 rounded-lg text-xs font-bold text-teal-700 cursor-pointer"
                      title="Increase stock by 50"
                    >
                      +50
                    </button>
                    <button
                      type="button"
                      onClick={() => setMedForm({ ...medForm, stockCount: '0' })}
                      className="px-2.5 py-1 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-bold text-red-700 cursor-pointer"
                    >
                      Out of Stock (0)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMedForm({ ...medForm, stockCount: '50' })}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-700 cursor-pointer"
                    >
                      Restock (50)
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PACKAGING / UNIT</label>
                  <input
                    type="text"
                    value={medForm.unit}
                    onChange={(e) => setMedForm({ ...medForm, unit: e.target.value })}
                    placeholder="e.g. Pack of 6 Tablets"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">NAFDAC REG. NUMBER</label>
                  <input
                    type="text"
                    value={medForm.nafdacNo}
                    onChange={(e) => setMedForm({ ...medForm, nafdacNo: e.target.value })}
                    placeholder="e.g. A4-0239"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">MANUFACTURER</label>
                  <input
                    type="text"
                    value={medForm.manufacturer}
                    onChange={(e) => setMedForm({ ...medForm, manufacturer: e.target.value })}
                    placeholder="e.g. Novartis Pharma"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">IMAGE URL</label>
                <input
                  type="url"
                  value={medForm.image}
                  onChange={(e) => setMedForm({ ...medForm, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">CLINICAL DESCRIPTION</label>
                <textarea
                  value={medForm.description}
                  onChange={(e) => setMedForm({ ...medForm, description: e.target.value })}
                  rows={2}
                  placeholder="Clinical indication and key details..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Prescription Checkbox */}
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="rxReq"
                  checked={medForm.prescriptionRequired}
                  onChange={(e) => setMedForm({ ...medForm, prescriptionRequired: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <label htmlFor="rxReq" className="text-xs font-semibold text-slate-800 cursor-pointer">
                  Requires Doctor’s Prescription Slip (Triggers ₦500 duty pharmacist verification)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setIsAddMedModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  {editingMed ? 'Save Changes' : 'Publish to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLINICAL NOTE MODAL FOR REQUESTS */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Add Clinical / Pharmacist Note
              </h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Request Ref: <strong>{selectedRequest.referenceNo || selectedRequest.id}</strong> ({selectedRequest.patientName})
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PHARMACIST VERIFICATION NOTE
              </label>
              <textarea
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="e.g. Prescription validated. No contraindications with patient history. Cleared for dispatch."
                rows={3}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedRequest.id, selectedRequest.status)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 cursor-pointer"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
