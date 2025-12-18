import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Image, FileText, Save, Eye, X, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2, Menu } from 'lucide-react';

const NexusOffice = () => {
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('Untitled Document');
  const [showToolbar, setShowToolbar] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [images, setImages] = useState([]);
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Format text
  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
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
      setContent(text);
    };

    if (file.type === 'text/plain' || file.type === 'text/markdown') {
      reader.readAsText(file);
    } else {
      reader.readAsText(file);
    }
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
      };
      setImages([...images, img]);
    };
    reader.readAsDataURL(file);
  };

  // Export to TXT
  const exportToTxt = () => {
    const text = editorRef.current?.innerText || '';
    const blob = new Blob([text], { type: 'text/plain' });
    downloadBlob(blob, `${fileName}.txt`);
  };

  // Export to HTML
  const exportToHtml = () => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${fileName}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
    img { max-width: 100%; height: auto; }
  </style>
</head>
<body>
  ${editorRef.current?.innerHTML || ''}
  ${images.map(img => `<img src="${img.src}" style="width: ${img.width}px; height: ${img.height}px;" />`).join('')}
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    downloadBlob(blob, `${fileName}.html`);
  };

  // Export to PDF (simplified)
  const exportToPdf = () => {
    alert('PDF export: Pour une meilleure expérience, utilisez "Imprimer > Enregistrer en PDF" dans votre navigateur');
    window.print();
  };

  // Download helper
  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  // Save to localStorage
  const saveDocument = () => {
    const doc = {
      fileName,
      content: editorRef.current?.innerHTML || '',
      images,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('nexus-office-doc', JSON.stringify(doc));
    alert('✅ Document sauvegardé localement');
  };

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('nexus-office-doc');
    if (saved) {
      const doc = JSON.parse(saved);
      setFileName(doc.fileName);
      setContent(doc.content);
      setImages(doc.images || []);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="bg-transparent border-none outline-none text-lg font-semibold focus:ring-2 focus:ring-purple-500 rounded px-2"
              placeholder="Nom du document"
            />
          </div>
          
          <div className="flex items-center gap-2">
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
      </div>

      {/* Toolbar */}
      {showToolbar && (
        <div className="bg-black/20 backdrop-blur-xl border-b border-white/10 sticky top-[57px] z-40">
          <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-1 overflow-x-auto">
            {/* Upload buttons */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.md,.docx,.pdf"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-white/10 rounded-lg transition flex items-center gap-1 text-sm"
              title="Upload Document"
            >
              <Upload className="w-4 h-4" />
            </button>

            <input
              type="file"
              ref={imageInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => imageInputRef.current?.click()}
              className="p-2 hover:bg-white/10 rounded-lg transition flex items-center gap-1 text-sm"
              title="Upload Image/Logo"
            >
              <Image className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-white/20 mx-1" />

            {/* Text formatting */}
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

            {/* Headings */}
            <button onClick={() => formatText('formatBlock', 'h1')} className="p-2 hover:bg-white/10 rounded-lg transition" title="Titre 1">
              <Heading1 className="w-4 h-4" />
            </button>
            <button onClick={() => formatText('formatBlock', 'h2')} className="p-2 hover:bg-white/10 rounded-lg transition" title="Titre 2">
              <Heading2 className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-white/20 mx-1" />

            {/* Lists */}
            <button onClick={() => formatText('insertUnorderedList')} className="p-2 hover:bg-white/10 rounded-lg transition" title="Liste">
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => formatText('insertOrderedList')} className="p-2 hover:bg-white/10 rounded-lg transition" title="Liste numérotée">
              <ListOrdered className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-white/20 mx-1" />

            {/* Alignment */}
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

      {/* Main Editor */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-2xl min-h-[800px] p-8 text-gray-900">
          {/* Images Section */}
          {images.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-4">
              {images.map((img) => (
                <div key={img.id} className="relative group">
                  <img
                    src={img.src}
                    alt="Uploaded"
                    className="rounded-lg shadow-lg"
                    style={{ width: `${img.width}px`, height: `${img.height}px`, objectFit: 'cover' }}
                  />
                  <button
                    onClick={() => setImages(images.filter(i => i.id !== img.id))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Editor */}
          <div
            ref={editorRef}
            contentEditable
            className="outline-none min-h-[600px] prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
            onInput={(e) => setContent(e.currentTarget.innerHTML)}
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
        className="fixed bottom-6 right-6 bg-purple-600 text-white p-4 rounded-full shadow-2xl hover:bg-purple-700 transition md:hidden"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Info Footer */}
      <div className="text-center py-6 text-sm text-white/60">
        <p>NEXUS OFFICE v0.1 - Mobile-First Document Editor</p>
        <p className="text-xs mt-1">Sauvegarde automatique dans le navigateur</p>
      </div>
    </div>
  );
};

export default NexusOffice;