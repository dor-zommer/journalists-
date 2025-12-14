import React, { useState, useRef } from 'react';
import { editImage } from '../services/geminiService';
import { Image as ImageIcon, Wand2, Upload, Loader2, Download, RefreshCcw } from 'lucide-react';

const ImageEditor: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setOriginalImage(event.target?.result as string);
        setEditedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async () => {
    if (!originalImage || !prompt.trim()) return;

    setLoading(true);
    try {
      // If we already have an edited image, allow editing THAT one further (chaining edits)
      // or just stick to original. For simplicity in this demo, we always edit the currently displayed main image.
      // Let's use the source image for now to keep it predictable, or user can download and re-upload.
      // Actually, standard UX: if there is an edited image, maybe we want to edit THAT. 
      // Let's stick to editing the 'Original' uploaded one for stability in this demo unless we implement a "Use as base" button.
      
      const result = await editImage(originalImage, prompt);
      setEditedImage(result);
    } catch (error) {
      alert("שגיאה בעריכת התמונה. נסה שנית.");
    } finally {
      setLoading(false);
    }
  };

  const useEditedAsBase = () => {
    if (editedImage) {
      setOriginalImage(editedImage);
      setEditedImage(null);
      setPrompt('');
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Wand2 className="w-6 h-6 text-purple-600" />
            עורך תמונות חכם
          </h2>
          <p className="text-slate-500">ערוך תמונות באמצעות פקודות טקסט עם Gemini 2.5 Flash Image</p>
        </div>
        
        <div className="flex gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-white border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 text-slate-700 font-medium"
            >
              <Upload className="w-4 h-4" />
              העלאת תמונה
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        {/* Left Column: Image Display */}
        <div className="bg-slate-900 rounded-xl overflow-hidden relative flex items-center justify-center p-4 border border-slate-800">
           {!originalImage ? (
             <div className="text-center text-slate-500">
               <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
               <p>העלה תמונה כדי להתחיל</p>
             </div>
           ) : (
             <img 
               src={editedImage || originalImage} 
               alt="Preview" 
               className="max-w-full max-h-full object-contain rounded shadow-lg"
             />
           )}
           
           {loading && (
             <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white z-10 backdrop-blur-sm">
               <Loader2 className="w-12 h-12 animate-spin mb-4 text-purple-400" />
               <p className="text-lg font-medium">מעבד תמונה...</p>
               <p className="text-sm text-slate-400 mt-2">Gemini מבצע את השינויים שביקשת</p>
             </div>
           )}
        </div>

        {/* Right Column: Controls */}
        <div className="flex flex-col gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-1">
             <h3 className="font-semibold mb-4 text-lg">הנחיות עריכה</h3>
             
             <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">תאר מה לשנות בתמונה</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder='לדוגמה: "הוסף פילטר וינטג", "הסר את האיש ברקע", "הפוך את השמיים לסגולים"'
                    className="w-full h-32 p-3 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    dir="rtl"
                  ></textarea>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {['הוסף פילטר שחור לבן', 'הפוך לציור שמן', 'הסר את הרקע', 'הוסף משקפי שמש'].map(suggestion => (
                    <button 
                      key={suggestion}
                      onClick={() => setPrompt(suggestion)}
                      className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full border border-purple-100 hover:bg-purple-100 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleEdit}
                  disabled={!originalImage || !prompt || loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-lg shadow-purple-200"
                >
                  <Wand2 className="w-5 h-5" />
                  בצע עריכה
                </button>
             </div>
          </div>

          {/* Version History / Actions */}
          {editedImage && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
               <h3 className="font-semibold mb-4">פעולות נוספות</h3>
               <div className="grid grid-cols-2 gap-3">
                 <button 
                   onClick={() => setEditedImage(null)}
                   className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700"
                 >
                   <RefreshCcw className="w-4 h-4" />
                   בטל שינויים
                 </button>
                 <a 
                   href={editedImage} 
                   download="edited-image.png"
                   className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100"
                 >
                   <Download className="w-4 h-4" />
                   הורד תמונה
                 </a>
                 <button
                   onClick={useEditedAsBase}
                   className="col-span-2 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100"
                 >
                   השתמש בתמונה הערוכה כבסיס
                 </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
