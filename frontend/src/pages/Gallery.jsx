import React, { useEffect, useState } from 'react';
import { Eye, Image as ImageIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/public/gallery?category=${filter}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setItems(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [filter]);

  const categories = [
    { name: 'ALL', value: 'all' },
    { name: 'CLASSROOMS', value: 'classroom' },
    { name: 'EVENTS', value: 'events' },
    { name: 'SPORTS', value: 'sports' },
    { name: 'CELEBRATIONS', value: 'celebrations' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 space-y-12">
      
      {/* Title */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <span className="text-brandCoral font-bold text-xs uppercase tracking-widest bg-brandCoral/10 px-3 py-1 rounded-full border border-brandCoral/20">MEMORIES BOARD</span>
        <h1 className="text-4xl font-quicksand font-bold text-slate-800">Photo & Video Gallery</h1>
        <p className="text-sm text-slate-500">
          A glimpse into the daily life, creative sessions, celebrations, and achievements of our young scholars.
        </p>
      </div>

      {/* Filter Menu */}
      <div className="flex flex-wrap justify-center gap-3">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilter(cat.value)}
            className={`px-5 py-2.5 rounded-full font-quicksand font-bold text-xs transition-all border ${
              filter === cat.value
                ? 'bg-brandSky text-white border-brandSky shadow transform -translate-y-0.5'
                : 'bg-white text-slate-600 border-orange-50 hover:bg-orange-50/20'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-brandSky rounded-full" />
          <p className="mt-2 text-xs text-slate-500 font-quicksand">Loading albums...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white border border-orange-50 rounded-2xl">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="mt-2 text-sm text-slate-500 font-quicksand font-medium">No media items in this category yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <motion.div
              layout
              key={item._id}
              onClick={() => setSelectedItem(item)}
              className="group relative bg-white border border-orange-50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition-shadow"
            >
              <div className="overflow-hidden relative h-52">
                <img
                  src={item.url ? item.url : `/api/public/gallery/image/${item._id}`}
                  alt={item.title}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800';
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-800 shadow">
                    <Eye className="w-5 h-5" />
                  </div>
                </div>
                {/* Category tag */}
                <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm border border-orange-100 text-[9px] uppercase font-bold text-slate-700 px-2 py-0.5 rounded-full shadow-sm">
                  {item.category}
                </span>
              </div>
              <div className="p-4 bg-white border-t border-slate-50">
                <h4 className="font-quicksand font-bold text-slate-800 text-sm leading-tight line-clamp-1">{item.title}</h4>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">{new Date(item.date).toLocaleDateString()}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Lightbox Modal overlay */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl overflow-hidden max-w-3xl w-full shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 bg-black/50 text-white hover:bg-black p-2 rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="h-[300px] md:h-[450px] bg-slate-900">
                <img
                  src={selectedItem.url ? selectedItem.url : `/api/public/gallery/image/${selectedItem._id}`}
                  alt={selectedItem.title}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800';
                  }}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="p-6 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brandCoral">
                  {selectedItem.category}
                </span>
                <h3 className="font-quicksand font-bold text-xl text-slate-800">
                  {selectedItem.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {selectedItem.description || 'No description provided.'}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  Date: {new Date(selectedItem.date).toLocaleDateString()}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
