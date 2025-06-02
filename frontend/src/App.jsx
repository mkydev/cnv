import React, { useState, useRef, useMemo } from 'react'; // useMemo hook'unu ekledik
import './App.css'; // Temel stil dosyasını içeri aktarıyoruz

// Her sekme için hangi format seçeneklerinin sunulacağını ve input tiplerini tanımlayalım
const formatOptions = {
  image: {
    label: 'Image Converter',
    inputAccept: 'image/*',
    output: [
      { value: '', label: 'Select Output Format...' },
      { value: 'png', label: 'PNG' },
      { value: 'jpg', label: 'JPG' },
      { value: 'pdf', label: 'PDF (From Image)' },
      { value: 'gif', label: 'GIF' },
      { value: 'webp', label: 'WebP' },
    ],
  },
  video: {
    label: 'Video/Audio Converter',
    inputAccept: 'video/*,audio/*',
     output: [
       { value: '', label: 'Select Output Format...' },
       { value: 'mp4', label: 'MP4' },
       { value: 'mp3', label: 'MP3 (Convert to Audio)' },
     ],
  },
  ocr: {
    label: 'Image to Text',
    inputAccept: 'image/*,.pdf',
     output: [
        { value: '', label: 'Select Output Format...' },
        { value: 'txt', label: 'Text (OCR)' },
     ],
  },
  pdf: {
    label: 'PDF Converter',
    inputAccept: 'image/*,.pdf',
     output: [
        { value: '', label: 'Select Output Format...' },
        { value: 'docx', label: 'Word' },
     ],
  },
};

function App() {
  // Durum değişkenleri:
  const [activeTab, setActiveTab] = useState('image');
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetFormat, setTargetFormat] = useState('');
  const [message, setMessage] = useState(''); // Kullanıcıya gösterilecek mesajlar (yükleniyor, başarılı, hata)
  const [downloadLink, setDownloadLink] = useState(''); // Başarılı dönüşüm sonrası indirme linki (OCR dışı)
  const [isLoading, setIsLoading] = useState(false); // Yüklenme durumu (dönüştürme devam ediyor mu?)
  const [extractedText, setExtractedText] = useState(''); // OCR metni
  const [isDragging, setIsDragging] = useState(false); // Sürükle-bırak durumu

  // Gizli dosya input elementine referans almak için
  const fileInputRef = useRef(null);

  // Aktif sekmeye göre mevcut format seçeneklerini ve input kabul tiplerini useMemo ile hesapla (optimizasyon için)
  const currentTabOptions = useMemo(() => formatOptions[activeTab], [activeTab]);
  const currentFormatOptions = currentTabOptions?.output || [];
  const currentInputAccept = currentTabOptions?.inputAccept || '*/*';


  // Sekme değiştiğinde çalışacak fonksiyon
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    // Sekme değişince tüm form ve sonuç state'lerini temizle
    setSelectedFile(null);
    setTargetFormat('');
    setMessage('');
    setDownloadLink('');
    setIsLoading(false);
    setExtractedText('');
    // Dosya inputunu resetle (eğer kullanıcı aynı dosyayı tekrar seçmek isterse diye)
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    console.log("Sekme değiştirildi:", tabName);
  };

  // Dosya seçme penceresini aç
  const handleChooseFilesClick = () => {
    fileInputRef.current.click();
  };

  // Sürükle-bırak eventleri için handler'lar
  const handleDragOver = (event) => {
    event.preventDefault(); // Varsayılan davranışı engelle (dosyanın açılmasını)
    setIsDragging(true); // Sürükleme olduğunu belirt
  };

  const handleDragLeave = () => {
    setIsDragging(false); // Sürükleme alanından çıkıldığını belirt
  };

  const handleDrop = (event) => {
    event.preventDefault(); // Varsayılan davranışı engelle
    setIsDragging(false); // Sürükleme bitti

    // Bırakılan dosyaları al
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0]; // Şimdilik sadece ilk dosyayı alıyoruz

      // İsteğe bağlı: Bırakılan dosya türünü aktif sekmenin kabul ettiği türlerle kontrol et
      // if (currentInputAccept !== '*/*' && !file.type.match(new RegExp(currentInputAccept.replace(/\*/g, '.*').split(',').join('|')))) {
      //     setMessage(`Hata: ${activeTab.toUpperCase()} sekmesi bu dosya türünü kabul etmiyor.`);
      //     return;
      // }


      setSelectedFile(file); // Dosyayı state'e kaydet
      setTargetFormat(''); // Yeni dosya seçildiğinde formatı temizle
      setMessage('');
      setDownloadLink('');
      setExtractedText('');
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Gizli inputu da temizle
      }
      console.log("Dosya bırakıldı:", file.name);
    }
  };

  // Dosya inputu değiştiğinde çalışacak fonksiyon (Hem butonla hem dropzone ile dosya seçilince tetiklenir)
  const handleFileChange = (event) => {
    const file = event.target.files[0];

     // İsteğe bağlı: Seçilen dosya türünü aktif sekmenin kabul ettiği türlerle kontrol et
    // if (currentInputAccept !== '*/*' && file && !file.type.match(new RegExp(currentInputAccept.replace(/\*/g, '.*').split(',').join('|')))) {
    //     setMessage(`Hata: ${activeTab.toUpperCase()} sekmesi bu dosya türünü kabul etmiyor.`);
    //      // Dosya inputunu temizle
    //      if (fileInputRef.current) {
    //         fileInputRef.current.value = '';
    //      }
    //     return;
    // }


    setSelectedFile(file);
    setTargetFormat(''); // Yeni dosya seçildiğinde formatı temizle
    setMessage('');
    setDownloadLink('');
    setExtractedText('');
    console.log("Dosya seçildi:", file ? file.name : 'Yok');
  };


  // Hedef format seçildiğinde çalışacak fonksiyon (Aynı kalıyor)
  const handleFormatChange = (event) => {
    const format = event.target.value;
    setTargetFormat(format);
    setMessage('');
    setDownloadLink('');
    setExtractedText('');
    console.log("Hedef format seçildi:", format);
  };

  // Dönüştür butonuna tıklandığında çalışacak asenkron fonksiyon (Mantık aynı kalıyor)
  const handleConvert = async () => {
    if (!selectedFile) {
      setMessage('Please select a file.');
      return;
    }
    if (!targetFormat || targetFormat === '') {
      setMessage('Please select target format.');
      return;
    }

    setIsLoading(true);
    setMessage('Converting, please wait...');
    setDownloadLink('');
    setExtractedText('');
    console.log("Dönüştürme işlemi başlatıldı...");

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('target_format', targetFormat);

    try {
      const response = await fetch('http://localhost:5001/convert', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log("Backend cevabı alındı:", data);

      if (response.ok) {
        if (data.success) {
            setMessage('Operation successful!');
            if (targetFormat === 'txt' && data.text_content !== undefined) {
                setExtractedText(data.text_content);
                setDownloadLink('');
                console.log("OCR text received.");
            } else if (data.output_filename) {
                setDownloadLink(`http://localhost:5001/download/${data.output_filename}`);
                setExtractedText('');
                console.log("Converted file name received.");
            } else {
                setMessage('Operation seems successful but no output information received.');
                setDownloadLink('');
                setExtractedText('');
                console.error("Backend returned success but no output data (text/filename) found.");
            }
        } else {
             // Backend success: false döndürdüyse (Hata)
            const errorMessage = data.error || 'Unknown error occurred.';
            setMessage(`Error: ${errorMessage}`);
            setDownloadLink('');
            setExtractedText('');
            console.error("Backend error:", errorMessage);
        }

      } else {
        // HTTP Status Hatası
        const errorMessage = data.error || `Server error: ${response.status}`;
        setMessage(`Error: ${errorMessage}`);
        setDownloadLink('');
        setExtractedText('');
        console.error("Backend error (HTTP Status Error):", errorMessage);
      }

    } catch (error) {
      console.error('Dönüştürme sırasında bir hata oluştu:', error);
      setMessage(`An error occurred: ${error.message}`);
      setDownloadLink('');
      setExtractedText('');
    } finally {
      setIsLoading(false);
      console.log("Dönüştürme işlemi tamamlandı.");
    }
  };


  // Hangi adımda olduğumuzu belirleyelim (Görsel indikatör için)
  const currentStep = !selectedFile ? 1 : (!targetFormat || targetFormat === '') ? 2 : (isLoading ? 3 : (downloadLink || extractedText) ? 3 : 3);
  // 3. adımın tamamlanıp tamamlanmadığını belirle
  const isStep3Complete = !isLoading && (downloadLink || extractedText);


  // Render edilecek JSX
  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            🗂️
          </div>
          <div className="tabs">
            {Object.keys(formatOptions).map(tabKey => (
              <button
                key={tabKey}
                className={activeTab === tabKey ? 'tab-button active' : 'tab-button'}
                onClick={() => handleTabChange(tabKey)}
              >
                {formatOptions[tabKey].label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Sekme İçerikleri */}
      <div className="tab-content">
        {/* Adım İndikatörleri (Zamzar Benzeri) - Tüm sekmelerde aynı görünümde */}
        <div className="conversion-steps">
            <div className={`step ${currentStep > 1 || isStep3Complete ? 'complete' : currentStep === 1 ? 'active' : ''}`}>
                <span className="step-number">1</span>
                <span className="step-text">File Select</span>
            </div>
            <div className={`step ${currentStep > 2 || isStep3Complete ? 'complete' : currentStep === 2 ? 'active' : ''}`}>
                 <span className="step-number">2</span>
                 <span className="step-text">Format Select</span>
            </div>
            <div className={`step ${isStep3Complete ? 'complete' : currentStep === 3 ? 'active' : ''}`}>
                 <span className="step-number">3</span>
                 <span className="step-text">Convert {isStep3Complete && '& Download'}</span> {/* 3. adım tamamlanınca metni değiştir */}
            </div>
        </div>

        {/* Ana Etkileşim Alanı: 3 Adım Yan Yana */}
        {/* Sürükle-bırak eventlerini bu konteynere ekleyelim */}
        <div
             className={`conversion-form-row ${isDragging ? 'dragging-over' : ''}`}
             onDragOver={handleDragOver}
             onDragLeave={handleDragLeave}
             onDrop={handleDrop}
           >

            {/* Adım 1: Dosya Seçme Alanı (Dropzone Benzeri) */}
            {/* useRef ile gizli inputu tetikleyeceğiz */}
            <input
               type="file"
               ref={fileInputRef}
               onChange={handleFileChange}
               style={{ display: 'none' }} // Inputu gizle
               accept={currentInputAccept} // Aktif sekmeye göre kabul edilecek dosya tipleri
            />
            <div
              className={`step-col choose-files`} // isDragging class'ını üst konteynere taşıdık
              onClick={handleChooseFilesClick} // Tıklayınca dosya seçiciyi aç
              // Drag eventleri üst row'da olduğu için burada gerek yok
            >
                 <div className="step-content">
                     {selectedFile ? (
                          <>
                             <div className="file-preview">
                                {selectedFile.type.startsWith('image/') ? (
                                    <img 
                                        src={URL.createObjectURL(selectedFile)} 
                                        alt="Preview" 
                                        className="preview-image"
                                    />
                                ) : (
                                    <div className="file-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                            <line x1="16" y1="13" x2="8" y2="13"></line>
                                            <line x1="16" y1="17" x2="8" y2="17"></line>
                                            <polyline points="10 9 9 9 8 9"></polyline>
                                        </svg>
                                    </div>
                                )}
                             </div>
                             <p className="selected-file-name">{selectedFile.name}</p>
                             <button 
                                className="remove-file-button"
                                onClick={() => {
                                    setSelectedFile(null);
                                    setTargetFormat('');
                                    if (fileInputRef.current) {
                                        fileInputRef.current.value = '';
                                    }
                                }}
                             >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                                Remove File
                             </button>
                          </>
                     ) : (
                          <>
                             <div className="upload-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="17 8 12 3 7 8"></polyline>
                                    <line x1="12" y1="3" x2="12" y2="15"></line>
                                </svg>
                             </div>
                             <button className="choose-files-button">
                                <span>Choose File or Drag & Drop</span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="17 8 12 3 7 8"></polyline>
                                    <line x1="12" y1="3" x2="12" y2="15"></line>
                                </svg>
                             </button>
                         </>
                     )}

                 </div>
             </div>


            {/* Adım 2: Hedef Format Seçme Alanı */}
            <div className="step-col convert-to">
                <div className="step-content">
                    <div className="format-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                        </svg>
                    </div>
                    {selectedFile ? ( // Dosya seçildiyse format seçimini göster
                         activeTab === 'ocr' ? (
                              // OCR için sadece "Metin (OCR)" seçeneğini göster, dropdown gibi görünmesine gerek yok
                             <button
                                className={`format-select-button ${targetFormat === 'txt' ? 'selected' : ''}`}
                                onClick={() => setTargetFormat('txt')}
                                disabled={isLoading || targetFormat === 'txt'} // Dönüşürken veya zaten seçili ise pasif
                             >
                                 {targetFormat === 'txt' ? 'Text Selected' : 'Convert to Text (OCR)'}
                             </button>
                         ) : (
                             // Diğer sekmeler için dropdown
                             <select
                                 id="targetFormat"
                                 value={targetFormat}
                                 onChange={handleFormatChange}
                                  disabled={isLoading} // Dönüşürken pasif yap
                                 className="format-select"
                             >
                               {currentFormatOptions.map(option => (
                                 <option key={option.value} value={option.value}>{option.label}</option>
                               ))}
                             </select>
                         )
                    ) : (
                        // Dosya seçilmediyse placeholder göster
                        <p className="placeholder-text">Select a file first</p>
                    )}
                </div>
            </div>


            {/* Adım 3: Dönüştür Butonu Alanı */}
            <div className="step-col convert-now">
                 <div className="step-content">
                    <div className="convert-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                    </div>
                    {!selectedFile && (
                        <p className="placeholder-text">Ready to convert</p>
                    )}
                    {selectedFile && !targetFormat && (
                        <p className="placeholder-text">Select format</p>
                    )}
                    {selectedFile && targetFormat && targetFormat !== '' && (
                        <button
                            onClick={handleConvert}
                            disabled={isLoading}
                            className="convert-button"
                        >
                            {isLoading ? (
                                <>
                                    <span>Converting...</span>
                                    <div className="button-spinner"></div>
                                </>
                            ) : (
                                <>
                                    <span>Convert</span>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"></path>
                                    </svg>
                                </>
                            )}
                        </button>
                    )}
                 </div>
             </div>

        </div> {/* .conversion-form-row sonu */}


         {/* Sonuç Alanları (Tüm Sekmeler İçin Ortak ve Form Alanının Altında) */}
         {/* Mesaj, İndirme Linki, Metin Çıktısı burada gösterilecek */}
         <div className="conversion-results">
             {/* Loading durumunda spinner veya progress bar gösterebiliriz */}
             {isLoading && (
                 <div className="loading-spinner"></div> 
             )}

             {/* Mesajları yüklenme spinner'ı ile aynı anda göstermeyelim */}
             {!isLoading && message && (
                 <p className={`status-message ${message.startsWith('Error') ? 'error' : 'success'}`}>{message}</p>
             )}

             {/* Sonuçları (İndirme Linki veya Metin) loading bitince göster */}
             {!isLoading && downloadLink && (
                <p>
                  Download converted file{' '}
                  <a href={downloadLink} target="_blank" rel="noopener noreferrer" download>
                     here
                  </a>
                </p>
              )}

              {!isLoading && extractedText && (
                <div style={{ marginTop: '15px', textAlign: 'left' }}>
                  <h3>Extracted Text:</h3>
                  <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', backgroundColor: '#eee', padding: '10px', borderRadius: '4px', maxHeight: '300px', overflowY: 'auto' }}>
                    {extractedText}
                  </pre>
                   {/* İsteğe bağlı: Metni kopyalama butonu */}
                </div>
              )}

         </div> {/* .conversion-results sonu */}


      </div> {/* .tab-content sonu */}


    </div> // .App sonu
  );
}

export default App;