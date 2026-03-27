import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Edit2, Trash2, Ticket, X, 
  Save, Image as ImageIcon, Tag, Hash, 
  Layers, MapPin, Info, DollarSign, Upload
} from 'lucide-react';
import { toast } from 'react-toastify';
import mealPassService from '../../services/mealPassService';

const CATEGORIES = [
  { id: 'breakfast', name: 'Breakfast' },
  { id: 'lunch', name: 'Lunch' },
  { id: 'snacks', name: 'Snacks' },
  { id: 'beverages', name: 'Beverages' },
];

const AdminMealPassPage = () => {
  const [mealPasses, setMealPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPass, setEditingPass] = useState(null);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    discount: '',
    description: '',
    canteen: '',
    category: 'lunch',
    tags: '',
    image: null, // This will hold the file object
  });
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchMealPasses();
  }, []);

  const fetchMealPasses = async () => {
    try {
      setLoading(true);
      const data = await mealPassService.getMealPasses();
      setMealPasses(data);
    } catch (error) {
      toast.error('Failed to fetch meal passes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (pass = null) => {
    if (pass) {
      setEditingPass(pass);
      setFormData({
        name: pass.name,
        price: pass.price,
        discount: pass.discount || '',
        description: pass.description || '',
        canteen: pass.canteen,
        category: pass.category,
        tags: pass.tags.join(', '),
        image: null,
      });
      setImagePreview(pass.image ? (pass.image.startsWith('http') ? pass.image : `http://localhost:5000${pass.image}`) : null);
    } else {
      setEditingPass(null);
      setFormData({
        name: '',
        price: '',
        discount: '',
        description: '',
        canteen: '',
        category: 'lunch',
        tags: '',
        image: null,
      });
      setImagePreview(null);
    }
    setIsModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.price.trim() || !formData.canteen.trim()) {
      toast.error('Name, Price, and Canteen are mandatory');
      return;
    }

    // Basic price validation (strip currency symbols if any, check if number)
    const priceValue = formData.price.replace(/[^\d.]/g, '');
    if (!priceValue || isNaN(priceValue)) {
      toast.error('Please enter a valid numeric price');
      return;
    }

    // Use FormData for file upload
    const data = new FormData();
    data.append('name', formData.name.trim());
    data.append('price', formData.price.trim());
    data.append('canteen', formData.canteen.trim());
    data.append('category', formData.category);
    
    // Optional fields
    if (formData.discount) data.append('discount', formData.discount.trim());
    if (formData.description) data.append('description', formData.description.trim());
    if (formData.tags) data.append('tags', formData.tags);
    if (formData.image) data.append('image', formData.image);


    try {
      if (editingPass) {
        await mealPassService.updateMealPass(editingPass._id, data);
        toast.success('Meal pass updated successfully');
      } else {
        await mealPassService.createMealPass(data);
        toast.success('Meal pass created successfully');
      }
      setIsModalOpen(false);
      fetchMealPasses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this meal pass?')) {
      try {
        await mealPassService.deleteMealPass(id);
        toast.success('Meal pass deleted successfully');
        fetchMealPasses();
      } catch (error) {
        toast.error('Failed to delete meal pass');
      }
    }
  };

  const filteredPasses = mealPasses.filter(pass => 
    pass.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pass.canteen?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 px-4 md:px-0">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-['Gilroy_Bold'] text-orange-600 tracking-tight">
            Meal Pass Management
          </h1>
          <p className="text-lg text-gray-400 font-['Gilroy_Medium']">
            Create and manage available meal passes for students.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-2xl font-['Gilroy_Bold'] hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 active:scale-95 group"
        >
          <div className="bg-white/20 p-1.5 rounded-lg group-hover:rotate-90 transition-transform duration-500">
            <Plus size={18} strokeWidth={3} />
          </div>
          <span className="tracking-tight">Add New Pass</span>
        </button>
      </header>

      {/* Search Bar */}
      <div className="relative group max-w-2xl">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={20} />
        <input
          type="text"
          placeholder="Search by meal name or canteen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-gray-100 rounded-[20px] py-4 pl-14 pr-6 outline-none focus:border-orange-200 focus:ring-4 focus:ring-orange-500/5 transition-all text-gray-700 font-['Gilroy_Medium'] shadow-sm"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-[32px] h-[400px] animate-pulse border border-gray-50" />
          ))}
        </div>
      ) : filteredPasses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPasses.map(pass => (
            <motion.div
              key={pass._id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col"
            >
              <div className="relative h-48 overflow-hidden rounded-t-[24px] bg-white group-hover:shadow-[inset_0_0_60px_rgba(0,0,0,0.05)] transition-all duration-500">
                <img 
                  src={pass.image ? (pass.image.startsWith('http') ? pass.image : `http://localhost:5000${pass.image}`) : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'} 
                  alt={pass.name}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6 justify-end gap-2">
                   <button 
                    onClick={() => handleOpenModal(pass)}
                    className="p-3 bg-white/90 backdrop-blur-md rounded-xl text-gray-900 hover:bg-white hover:text-orange-600 transition-all shadow-lg"
                   >
                    <Edit2 size={18} />
                   </button>
                   <button 
                    onClick={() => handleDelete(pass._id)}
                    className="p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shadow-lg"
                   >
                    <Trash2 size={18} />
                   </button>
                </div>
                <div className="absolute top-4 left-4">
                  <span className="bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-full text-[11px] font-['Gilroy_Bold'] tracking-widest text-orange-600 uppercase shadow-sm">
                    {pass.category}
                  </span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-1.5 gap-2">
                  <h3 className="text-lg font-['Gilroy_Bold'] text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1">{pass.name}</h3>
                  <span className="text-base font-['Gilroy_Heavy'] text-gray-900">{pass.price}</span>
                </div>
                
                <div className="flex items-center gap-1.5 text-orange-500 text-xs font-['Gilroy_Bold'] mb-3">
                  <MapPin size={14} />
                  <span>{pass.canteen}</span>
                </div>

                <p className="text-gray-400 text-xs font-['Gilroy_Medium'] line-clamp-2 mb-4">
                  {pass.description || 'No description provided.'}
                </p>

                <div className="mt-auto flex flex-wrap gap-1.5">
                  {pass.tags && pass.tags.map(tag => (
                    <span key={tag} className="bg-gray-50 text-gray-400 px-2 py-0.5 rounded-full text-[9px] font-['Gilroy_Bold'] uppercase tracking-wider">
                      {tag}
                    </span>
                  ))}
                  {(!pass.tags || pass.tags.length === 0) && <span className="text-[9px] text-gray-300 italic">No tags</span>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-gray-100 p-20 text-center shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-gray-300">
            <Ticket size={32} />
          </div>
          <h3 className="text-xl font-['Gilroy_Bold'] text-gray-900 mb-2">No Meal Passes Found</h3>
          <p className="text-gray-400 font-['Gilroy_Medium'] max-w-sm mx-auto mb-8">
            {searchQuery ? "No results match your search." : "Start by creating your first meal pass offering."}
          </p>
        </div>
      )}

      {/* --- ADD/EDIT MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden my-8"
            >
              <div className="bg-orange-50 p-8 border-b border-orange-100 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-['Gilroy_Bold'] text-gray-900">
                    {editingPass ? 'Edit Meal Pass' : 'Add New Meal Pass'}
                  </h2>
                  <p className="text-sm font-['Gilroy_Medium'] text-gray-500 mt-1">
                    Configure the meal pass availability and details.
                  </p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white rounded-2xl text-gray-400 hover:text-gray-900 transition-colors shadow-sm">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-['Gilroy_Bold'] text-gray-400 uppercase tracking-widest mb-2">Meal Name *</label>
                    <div className="relative">
                      <Ticket size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        required
                        type="text"
                        placeholder="e.g. Chicken Rice"
                        className="w-full bg-gray-50 border border-transparent rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:bg-white focus:border-orange-200 transition-all font-['Gilroy_Medium'] text-gray-700"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-['Gilroy_Bold'] text-gray-400 uppercase tracking-widest mb-2">Price *</label>
                      <div className="relative">
                        <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          required
                          type="text"
                          placeholder="Rs. 650"
                          className="w-full bg-gray-50 border border-transparent rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:bg-white focus:border-orange-200 transition-all font-['Gilroy_Medium'] text-gray-700"
                          value={formData.price}
                          onChange={e => setFormData({...formData, price: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-['Gilroy_Bold'] text-gray-400 uppercase tracking-widest mb-2">Discount Label</label>
                      <div className="relative">
                        <Tag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="100% Free"
                          className="w-full bg-gray-50 border border-transparent rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:bg-white focus:border-orange-200 transition-all font-['Gilroy_Medium'] text-gray-700"
                          value={formData.discount}
                          onChange={e => setFormData({...formData, discount: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-['Gilroy_Bold'] text-gray-400 uppercase tracking-widest mb-2">Canteen Location *</label>
                    <div className="relative">
                      <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        required
                        type="text"
                        placeholder="e.g. Main Canteen"
                        className="w-full bg-gray-50 border border-transparent rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:bg-white focus:border-orange-200 transition-all font-['Gilroy_Medium'] text-gray-700"
                        value={formData.canteen}
                        onChange={e => setFormData({...formData, canteen: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-['Gilroy_Bold'] text-gray-400 uppercase tracking-widest mb-2">Category *</label>
                    <div className="relative">
                      <Layers size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <select
                        className="w-full bg-gray-50 border border-transparent rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:bg-white focus:border-orange-200 transition-all font-['Gilroy_Medium'] text-gray-700 appearance-none"
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                      >
                        {CATEGORIES.map(cat => (
                           <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-['Gilroy_Bold'] text-gray-400 uppercase tracking-widest mb-2">Upload Image</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-100 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 hover:border-orange-200 hover:bg-orange-50/30 transition-all cursor-pointer group group-active:scale-[0.98]"
                    >
                      {imagePreview ? (
                         <div className="relative w-full h-24 rounded-2xl overflow-hidden">
                            <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <Upload className="text-white" size={24} />
                            </div>
                         </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-orange-500 group-hover:bg-white transition-all">
                             <Upload size={20} />
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-['Gilroy_Bold'] text-gray-400 uppercase tracking-widest">Drop here or Click</p>
                          </div>
                        </>
                      )}
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-['Gilroy_Bold'] text-gray-400 uppercase tracking-widest mb-2">Tags (Comma Separated)</label>
                      <div className="relative">
                        <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Spicy, Popular, Veg"
                          className="w-full bg-gray-50 border border-transparent rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:bg-white focus:border-orange-200 transition-all font-['Gilroy_Medium'] text-gray-700"
                          value={formData.tags}
                          onChange={e => setFormData({...formData, tags: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-['Gilroy_Bold'] text-gray-400 uppercase tracking-widest mb-2">Description</label>
                      <div className="relative">
                        <Info size={18} className="absolute left-4 top-3 text-gray-400" />
                        <textarea
                          placeholder="Enter meal details (optional)..."
                          rows="2"
                          className="w-full bg-gray-50 border border-transparent rounded-2xl py-3 pl-12 pr-4 outline-none focus:bg-white focus:border-orange-200 transition-all font-['Gilroy_Medium'] text-gray-700 resize-none"
                          value={formData.description}
                          onChange={e => setFormData({...formData, description: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-10 py-4 rounded-2xl font-['Gilroy_Bold'] text-base hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    <Save size={18} strokeWidth={2.5} />
                    <span>{editingPass ? 'Update Meal Pass' : 'Add Meal Pass'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminMealPassPage;
