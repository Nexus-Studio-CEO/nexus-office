import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Image, FileText, Save, X, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2, Menu, FolderOpen, Plus, Trash2, File, Move } from 'lucide-react';

const NexusOffice = () => {
  const [fileName, setFileName] = useState('Untitled Document');
  const [showToolbar, setShowToolbar] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [images, setImages] = useState([]);
  const [resizingImage, setResizingImage] = useState(null);
  const [draggingImage, setDraggingImage] = useState(null);
  const [library, setLibrary] = useState([]);
  const [currentDocId, setCurrentDocId] = useState(null);
  
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const longPressTimer = useRef(null);

  // Load library on mount
  useEffect(() => {
    const saved = localStorage.getItem('nexus-office-library');
    if (saved) {
      const lib = JSON.parse(saved);
      setLibrary(lib);
      if (lib.length > 0 && lib[0].content) {
        loadDocument(lib[0].id);
      }
    }
  }, []);

  // Format text - preserve cursor position
  const formatText = (command, value = null) => {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    
    document.execCommand(command, false, value);
    
    // Restore selection
    selection.removeAllRanges();
    selection.addRange(range);
    editorRef.current?.focus();
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name.replace(/\.[^/.]+$/, ""));
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target.result;
      if (editorRef.current) {
        editorRef.current.innerHTML = text;
      }
    };

    reader.readAsText(file);
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = {
        id: Date.now(),
        src: event.target.result,
        width: 300,
        height: 200,
        x: 50,
        y: 50
      };
      setImages([...images, img]);
    };
    reader.readAsDataURL(file);
  };

  // Start resizing image
  const startResize = (imgId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingImage({
      id: imgId,
      startX: e.clientX || e.touches?.[0]?.clientX,
      startY: e.clientY || e.touches?.[0]?.clientY,
      startWidth: images.find(i => i.id === imgId).width,
      startHeight: images.find(i => i.id === imgId).height
    });
  };

  // Start dragging image - Long press for mobile
  const startDragImage = (imgId, e) => {
    if (e.target.closest('.resize-handle')) return;
    
    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const clientY = e.clientY || e.touches?.[0]?.clientY;
    const img = images.find(i => i.id === imgId);
    
    longPressTimer.current = setTimeout(() => {
      setDraggingImage({
        id: imgId,
        startX: clientX,
        startY: clientY,
        offsetX: clientX - img.x,
        offsetY: clientY - img.y
      });
    }, 300); // 300ms long press
  };

  const cancelDragStart = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Handle resize
  useEffect(() => {
    if (!resizingImage) return;

    const handleMove = (e) => {
      const clientX = e.clientX || e.touches?.[0]?.clientX;
      const clientY = e.clientY || e.touches?.[0]?.clientY;
      
      const deltaX = clientX - resizingImage.startX;
      const deltaY = clientY - resizingImage.startY;
      
      const newWidth = Math.max(100, resizingImage.startWidth + deltaX);
      const newHeight = Math.max(100, resizingImage.startHeight + deltaY);
      
      setImages(prev => prev.map(img => 
        img.id === resizingImage.id 
          ? { ...img, width: newWidth, height: newHeight }
          : img
      ));
    };

    const handleEnd = () => {
      setResizingImage(null);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [resizingImage]);

  // Handle drag
  useEffect(() => {
    if (!draggingImage) return;

    const handleMove = (e) => {
      const clientX = e.clientX || e.touches?.[0]?.clientX;
      const clientY = e.clientY || e.touches?.[0]?.clientY;
      
      const newX = clientX - draggingImage.offsetX;
      const newY = clientY - draggingImage.offsetY;
      
      setImages(prev => prev.map(img => 
        img.id === draggingImage.id 
          ? { ...img, x: newX, y: newY }
          : img
      ));
    };

    const handleEnd = () => {
      setDraggingImage(null);
      cancelDragStart();
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [draggingImage]);

  // Export functions
  const exportToTxt = () => {
    const text = editorRef.current?.innerText || '';
    const blob = new Blob([text], { type: 'text/plain' });
    downloadBlob(blob, `${fileName}.txt`);
  };

  const exportToHtml = () => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${fileName}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; position: relative; }
    img { position: absolute; }
  </style>
</head>
<body>
  ${images.map(img => `<img src="${img.src}" style="width: ${img.width}px; height: ${img.height}px; left: ${img.x}px; top: ${img.y}px;" />`).join('')}
  ${editorRef.current?.innerHTML || ''}
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    downloadBlob(blob, `${fileName}.html`);
  };

  const exportToPdf = () => {
    window.print();
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  // Document management
  const saveDocument = () => {
    const doc = {
      id: currentDocId || Date.now(),
      fileName,
      content: editorRef.current?.innerHTML || '',
      images,
      timestamp: new Date().toISOString()
    };

    let updatedLibrary;
    if (currentDocId) {
      updatedLibrary = library.map(d => d.id === currentDocId ? doc : d);
    } else {
      updatedLibrary = [...library, doc];
      setCurrentDocId(doc.id);
    }
    
    setLibrary(updatedLibrary);
    localStorage.setItem('nexus-office-library', JSON.stringify(updatedLibrary));
    alert('✅ Document sauvegardé');
  };

  const createNewDocument = () => {
    setCurrentDocId(null);
    setFileName('Untitled Document');
    setImages([]);
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
    setShowLibrary(false);
  };

  const loadDocument = (id) => {
    const doc = library.find(d => d.id === id);
    if (doc) {
      setCurrentDocId(doc.id);
      setFileName(doc.fileName);
      setImages(doc.images || []);
      if (editorRef.current) {
        editorRef.current.innerHTML = doc.content || '';
      }
      setShowLibrary(false);
    }
  };

  const deleteDocument = (id) => {
    if (confirm('Supprimer ce document ?')) {
      const updatedLibrary = library.filter(d => d.id !== id);
      setLibrary(updatedLibrary);
      localStorage.setItem('nexus-office-library', JSON.stringify(updatedLibrary));
      
      if (currentDocId === id) {
        createNewDocument();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header - Fixed */}
      <div className="bg-black/30 backdrop-blur-xl border-b border-white/10 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="bg-transparent border-none outline-none text-lg font-semibold focus:ring-2 focus:ring-purple-500 rounded px-2 w-48"
              placeholder="Nom du document"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLibrary(!showLibrary)}
              className="p-2 hover:bg-white/10 rounded-lg transition"
              title="Bibliothèque"
            >
              <FolderOpen className="w-5 h-5" />
            </button>
            <button
              onClick={createNewDocument}
              className="p-2 hover:bg-white/10 rounded-lg transition"
              title="Nouveau document"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              onClick={saveDocument}
              className="p-2 hover:bg-white/10 rounded-lg transition"
              title="Sauvegarder"
            >
              <Save className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-2 hover:bg-white/10 rounded-lg transition relative"
              title="Exporter"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Export Menu */}
        {showExportMenu && (
          <div className="absolute right-4 top-16 bg-slate-800 rounded-lg shadow-2xl border border-white/10 p-2 min-w-[200px]">
            <button onClick={exportToTxt} className="w-full text-left px-4 py-2 hover:bg-white/10 rounded flex items-center gap-2">
              <FileText className="w-4 h-4" /> Export TXT
            </button>
            <button onClick={exportToHtml} className="w-full text-left px-4 py-2 hover:bg-white/10 rounded flex items-center gap-2">
              <FileText className="w-4 h-4" /> Export HTML
            </button>
            <button onClick={exportToPdf} className="w-full text-left px-4 py-2 hover:bg-white/10 rounded flex items-center gap-2">
              <FileText className="w-4 h-4" /> Export PDF
            </button>
          </div>
        )}

        {/* Library Panel */}
        {showLibrary && (
          <div className="absolute left-4 right-4 top-16 bg-slate-800 rounded-lg shadow-2xl border border-white/10 p-4 max-h-[400px] overflow-y-auto">
            <h3 className="text-lg font-bold mb-3">Documents ({library.length})</h3>
            {library.length === 0 ? (
              <p className="text-white/60 text-sm">Aucun document sauvegardé</p>
            ) : (
              <div className="space-y-2">
                {library.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between bg-white/5 p-3 rounded-lg hover:bg-white/10 transition">
                    <button
                      onClick={() => loadDocument(doc.id)}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      <File className="w-4 h-4" />
                      <div>
                        <p className="font-medium">{doc.fileName}</p>
                        <p className="text-xs text-white/60">
                          {new Date(doc.timestamp).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDocument(doc.id);
                      }}
                      className="p-2 hover:bg-red-500/20 rounded transition"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toolbar - Fixed below header */}
      {showToolbar && (
        <div className="bg-black/20 backdrop-blur-xl border-b border-white/10 fixed top-[57px] left-0 right-0 z-40">
          <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-1 overflow-x-auto">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".txt,.md,.docx,.pdf" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-white/10 rounded-lg transition" title="Upload Document">
              <Upload className="w-4 h-4" />
            </button>

            <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            <button onClick={() => imageInputRef.current?.click()} className="p-2 hover:bg-white/10 rounded-lg transition" title="Upload Image/Logo">
              <Image className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-white/20 mx-1" />

            <button onClick={() => formatText('bold')} className="p-2 hover:bg-white/10 rounded-lg transition" title="Gras">
              <Bold className="w-4 h-4" />
            </button>
            <button onClick={() => formatText('italic')} className="p-2 hover:bg-white/10 rounded-lg transition" title="Italique">
              <Italic className="w-4 h-4" />
            </button>
            <button onClick={() => formatText('underline')} className="p-2 hover:bg-white/10 rounded-lg transition" title="Souligné">
              <Underline className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-white/20 mx-1" />

            <button onClick={() => formatText('formatBlock', 'h1')} className="p-2 hover:bg-white/10 rounded-lg transition" title="Titre 1">
              <Heading1 className="w-4 h-4" />
            </button>
            <button onClick={() => formatText('formatBlock', 'h2')} className="p-2 hover:bg-white/10 rounded-lg transition" title="Titre 2">
              <Heading2 className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-white/20 mx-1" />

            <button onClick={() => formatText('insertUnorderedList')} className="p-2 hover:bg-white/10 rounded-lg transition" title="Liste">
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => formatText('insertOrderedList')} className="p-2 hover:bg-white/10 rounded-lg transition" title="Liste numérotée">
              <ListOrdered className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-white/20 mx-1" />

            <button onClick={() => formatText('justifyLeft')} className="p-2 hover:bg-white/10 rounded-lg transition" title="Aligner à gauche">
              <AlignLeft className="w-4 h-4" />
            </button>
            <button onClick={() => formatText('justifyCenter')} className="p-2 hover:bg-white/10 rounded-lg transition" title="Centrer">
              <AlignCenter className="w-4 h-4" />
            </button>
            <button onClick={() => formatText('justifyRight')} className="p-2 hover:bg-white/10 rounded-lg transition" title="Aligner à droite">
              <AlignRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Editor - Padding for fixed headers */}
      <div className="max-w-4xl mx-auto px-4 pt-32 pb-8">
        <div className="bg-white rounded-lg shadow-2xl min-h-[800px] p-8 text-gray-900 relative">
          {/* Images Layer */}
          {images.map((img) => (
            <div
              key={img.id}
              className="absolute group"
              style={{
                left: `${img.x}px`,
                top: `${img.y}px`,
                width: `${img.width}px`,
                height: `${img.height}px`,
                cursor: draggingImage?.id === img.id ? 'grabbing' : 'grab',
                zIndex: draggingImage?.id === img.id ? 50 : 10
              }}
              onMouseDown={(e) => startDragImage(img.id, e)}
              onTouchStart={(e) => startDragImage(img.id, e)}
              onMouseUp={cancelDragStart}
              onTouchEnd={cancelDragStart}
            >
              <img
                src={img.src}
                alt="Uploaded"
                className="rounded-lg shadow-lg w-full h-full object-cover"
                draggable="false"
              />
              
              {/* Move indicator */}
              {draggingImage?.id === img.id && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-purple-600 rounded-full p-3 pointer-events-none">
                  <Move className="w-6 h-6 text-white" />
                </div>
              )}
              
              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setImages(images.filter(i => i.id !== img.id));
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition z-20"
              >
                <X className="w-4 h-4" />
              </button>
              
              {/* Resize handle */}
              <div
                className="resize-handle absolute bottom-0 right-0 w-8 h-8 bg-purple-500 rounded-tl-lg cursor-se-resize opacity-0 group-hover:opacity-100 transition flex items-center justify-center z-20"
                onMouseDown={(e) => startResize(img.id, e)}
                onTouchStart={(e) => startResize(img.id, e)}
                title="Redimensionner"
              >
                <div className="w-3 h-3 border-r-2 border-b-2 border-white"></div>
              </div>
            </div>
          ))}

          {/* Editor - Text only */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className="outline-none min-h-[600px] prose prose-lg max-w-none relative z-0"
            style={{
              lineHeight: '1.8',
              fontSize: '16px'
            }}
          />
        </div>
      </div>

      {/* Mobile Toolbar Toggle */}
      <button
        onClick={() => setShowToolbar(!showToolbar)}
        className="fixed bottom-6 right-6 bg-purple-600 text-white p-4 rounded-full shadow-2xl hover:bg-purple-700 transition z-50"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Info Footer */}
      <div className="text-center py-6 text-sm text-white/60">
        <p>NEXUS OFFICE v0.3 - Mobile-First Document Editor</p>
        <p className="text-xs mt-1">Appui long sur image pour déplacer • Drag coin pour redimensionner</p>
      </div>
    </div>
  );
};

export default NexusOffice;