import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, Star, Send, ChevronDown, CheckCircle, Info, MessageSquare, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';
import canteenImg from '../../assets/images/canteen.jpg';

const CANTEENS = [
  { 
    id: 'computing', 
    name: 'Faculty of Computing Canteen', 
    location: 'New Building, Ground Floor',
    description: 'A modern and vibrant dining space for computing students and staff. Featuring high-speed WiFi and tech-inspired decor, it offers the perfect environment for coding over coffee.',
    image: canteenImg
  },
  { 
    id: 'science', 
    name: 'Science Block Cafe', 
    location: 'Main Building, Block B',
    description: 'A modern, quick-service cafe specializing in espresso drinks, artisanal sandwiches, and fresh pastries. Perfect for a quick recharge between labs and deep work sessions.',
    image: canteenImg
  },
  { 
    id: 'perera', 
    name: 'Perera and Sons', 
    location: 'Main Building, Food Court',
    description: 'A premier Sri Lankan bakery and restaurant offering a delightful range of savory pastries, sweets, and traditional meal combos. Known for consistent quality and great service.',
    image: canteenImg
  },
  { 
    id: 'juice', 
    name: 'Library Juice Bar', 
    location: 'Main Building, Library Annex',
    description: 'Refresh your mind with our cold-pressed juices, protein smoothies, and seasonal fruit bowls. Located in the library annex for a quiet, healthy break during study marathons.',
    image: canteenImg
  },
  { 
    id: 'engineering', 
    name: 'Engineering Block Mess', 
    location: 'West Wing, Near Lab 5',
    description: 'A spacious high-energy dining area designed for engineering students. Offers high-protein lunch specials and a quiet mezzanine floor perfect for project discussions.',
    image: canteenImg
  },
  { 
    id: 'global', 
    name: 'Global Education Plaza Cafe', 
    location: 'International Quad, Building 4',
    description: 'A premium, fast-paced kiosk serving diverse grab-and-go options from around the world. Situated right next to the central fountain, it offers a great outdoor seating area for socializing.',
    image: canteenImg
  }
];

const CanteenReviewPage = () => {
  const [selectedCanteen, setSelectedCanteen] = useState(CANTEENS[0]);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [allReviews, setAllReviews] = useState([
    { id: 1, name: 'Main Canteen', rating: 5, text: 'Great varieties and taste!', date: new Date().toLocaleDateString() },
    { id: 2, name: 'Science Cafe', rating: 4, text: 'Coffee is excellent, but pastries sell out fast.', date: new Date().toLocaleDateString() }
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (reviewText.length < 5) {
      toast.error('Please share a bit more detail (min 5 characters)');
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      const newEntry = {
        id: Date.now(),
        name: selectedCanteen.name,
        rating: rating,
        text: reviewText,
        date: 'Just Now'
      };

      setAllReviews([newEntry, ...allReviews]);
      setIsSubmitting(false);
      setIsSuccess(true);
      toast.success('Review submitted!');
      // Reset after 2 seconds
      setTimeout(() => {
        setIsSuccess(false);
        setRating(0);
        setReviewText('');
      }, 2000);
    }, 1200);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans overflow-hidden">
      <header className="space-y-1">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <MessageSquare className="text-orange-500" size={32} />
          Reviews & Rating
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: Canteen Selection & Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 space-y-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Select Canteen</label>
              <div className="relative">
                <select 
                  value={selectedCanteen.id} 
                  onChange={(e) => setSelectedCanteen(CANTEENS.find(c => c.id === e.target.value))}
                  className="w-full bg-orange-50/50 border border-orange-100 rounded-2xl py-4 flex pl-12 pr-6 outline-none appearance-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:shadow-lg focus:shadow-orange-500/5 transition-all text-sm font-bold text-gray-800 shadow-sm"
                >
                  {CANTEENS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <Utensils className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={18} />
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-500" size={18} />
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div 
                key={selectedCanteen.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4 pt-4 border-t border-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-md border-2 border-white shrink-0">
                    <img src={selectedCanteen.image} alt={selectedCanteen.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 leading-tight mb-1">{selectedCanteen.name}</h3>
                    <div className="flex items-center gap-1 text-orange-500">
                      <MapPin size={10} />
                      <span className="text-[9px] font-black uppercase tracking-widest">{selectedCanteen.location}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100/50 shadow-inner">
                    <p className="text-[11px] font-bold leading-relaxed text-gray-600 italic">"{selectedCanteen.description}"</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Review Form */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-gray-200/40 border border-gray-100 min-h-full relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 group-hover:opacity-100 transition-opacity" />
            
            {isSuccess ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center space-y-6"
              >
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                  <CheckCircle size={48} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 mb-2">Feedback Received</h2>
                  <p className="text-gray-500 font-medium">Your input matters to us!</p>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                <div className="space-y-4">
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Your Rating</label>
                  <div className="flex justify-center gap-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className={`p-2 transition-all transform active:scale-90 ${
                          (hoveredRating || rating) >= star ? 'scale-125' : 'grayscale opacity-30 shadow-none'
                        }`}
                      >
                        <Star 
                          size={40} 
                          fill={(hoveredRating || rating) >= star ? '#f97316' : 'transparent'} 
                          className={(hoveredRating || rating) >= star ? 'text-orange-500 drop-shadow-lg' : 'text-gray-300'} 
                          strokeWidth={2}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-xs font-black text-gray-400 uppercase tracking-tighter">
                    {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Great' : rating === 5 ? 'Excellent' : 'Select a score'}
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest">Share Your Thoughts</label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Write your review here... How was the quality, service, and wait time?"
                    className="w-full bg-gray-50/50 border border-gray-100 rounded-3xl p-6 outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-200 transition-all text-sm font-medium text-gray-700 placeholder-gray-300 min-h-[180px] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-fit min-w-[200px] mx-auto px-12 py-4 rounded-full font-black text-[12px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all relative overflow-hidden shadow-xl ${
                    isSubmitting 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-orange-600 text-white hover:bg-orange-700 hover:shadow-orange-500/30 active:scale-[0.98]'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Submit Review"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Review Feed Section */}
      <section className="mt-12 space-y-6">
        <h2 className="text-xl font-black text-gray-900 tracking-tight px-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            Recent Feedback
            <span className="text-[10px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full uppercase tracking-widest hidden sm:inline-block border border-orange-200 shadow-sm">{selectedCanteen.name}</span>
          </div>
          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none">Showing Latest</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {allReviews.filter(r => r.name === selectedCanteen.name).length > 0 ? (
              allReviews
                .filter(r => r.name === selectedCanteen.name)
                .map((rev) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    key={rev.id}
                    className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all h-full"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{rev.date}</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={10} fill={s <= rev.rating ? '#f97316' : 'transparent'} className={s <= rev.rating ? 'text-orange-500' : 'text-gray-200'} />
                          ))}
                        </div>
                      </div>
                      <h4 className="text-[11px] font-black text-orange-500 mb-2 uppercase tracking-tight">{rev.name}</h4>
                      <p className="text-[11px] font-bold text-gray-600 italic leading-relaxed">"{rev.text}"</p>
                    </div>
                  </motion.div>
                ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="col-span-full py-16 text-center border-2 border-dashed border-gray-100 rounded-[2.5rem] bg-gray-50/50"
              >
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <MessageSquare className="text-gray-200" size={20} />
                </div>
                <p className="text-xs font-black text-gray-300 uppercase tracking-[0.2em] italic">No reviews for this canteen yet</p>
                <p className="text-[10px] text-gray-400 mt-2 font-medium">Be the first to share your experience!</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
};

export default CanteenReviewPage;
