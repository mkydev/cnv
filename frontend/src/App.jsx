import React, { useState, useRef, useMemo } from 'react';
import './App.css';

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
    label: 'Extract Text (OCR)',
    inputAccept: 'image/*,.pdf',
     output: [ // OCR for single format
        { value: 'txt', label: 'Text (OCR)' },
     ],
  },
  pdf: {
    label: 'PDF Tools', // TAB NAME
    inputAccept: '.pdf', // PDF Tools primarily take PDF files
    subOperations: [ // Sub-operations for PDF
      { id: 'pdf-to-docx', label: 'Convert PDF to Word (DOCX)', targetFormat: 'docx' },
      // Future PDF operations can be added here:
      // { id: 'pdf-merge', label: 'Merge PDFs', targetFormat: 'pdf', multipleFiles: true },
      // { id: 'pdf-split', label: 'Split PDF Pages', targetFormat: 'pdf' },
    ],
  },
};

function App() {
  const [activeTab, setActiveTab] = useState('image');
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetFormat, setTargetFormat] = useState('');
  const [selectedPdfOperation, setSelectedPdfOperation] = useState('');
  const [message, setMessage] = useState('');
  const [downloadLink, setDownloadLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  const currentTabOptions = useMemo(() => formatOptions[activeTab], [activeTab]);

  const currentInputAccept = useMemo(() => {
    return currentTabOptions?.inputAccept || '*/*';
  }, [currentTabOptions]);

  const resetApplicationStates = () => {
    setSelectedFile(null);
    setTargetFormat('');
    setSelectedPdfOperation('');
    setMessage('');
    setDownloadLink('');
    setIsLoading(false);
    setExtractedText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    resetApplicationStates();
    console.log("Tab changed to:", tabName);
  };

  const handleChooseFilesClick = () => {
    if (!selectedFile) { 
        fileInputRef.current.click();
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const commonFileSelectActions = (file) => {
    setSelectedFile(file);
    setTargetFormat('');
    setSelectedPdfOperation('');
    setMessage('');
    setDownloadLink('');
    setExtractedText('');
    if (fileInputRef.current && !file) {
        fileInputRef.current.value = '';
    }
  }

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      commonFileSelectActions(file);
      console.log("File dropped:", file.name);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
        commonFileSelectActions(file);
        console.log("File selected:", file.name);
    } else { 
        commonFileSelectActions(null);
    }
  };
  
  const handleRemoveFile = (e) => {
    e.stopPropagation(); 
    commonFileSelectActions(null);
  };

  const handleFormatDropdownChange = (event) => {
    const format = event.target.value;
    setTargetFormat(format);
    setSelectedPdfOperation(''); 
    setMessage('');
    setDownloadLink('');
    setExtractedText('');
    console.log("Target format (select) chosen:", format);
  };

  const handlePdfOperationSelect = (operationId) => {
    const operation = formatOptions.pdf.subOperations.find(op => op.id === operationId);
    if (operation) {
      setSelectedPdfOperation(operationId);
      setTargetFormat(operation.targetFormat); 
      setMessage('');
      setDownloadLink('');
      setExtractedText('');
      console.log("PDF Operation selected:", operation.label, "Target format:", operation.targetFormat);
    }
  };

  const handleOcrSelect = () => {
    setTargetFormat('txt'); 
    setSelectedPdfOperation(''); 
    setMessage('');
    setDownloadLink('');
    setExtractedText('');
    console.log("OCR (Text) format selected.");
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      setMessage('Please select a file.');
      return;
    }
    if (!targetFormat) { 
      setMessage('Please select a target format or operation.');
      return;
    }

    setIsLoading(true);
    setMessage('Converting, please wait...');
    setDownloadLink('');
    setExtractedText('');

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('target_format', targetFormat);

    try {
      const response = await fetch('http://localhost:5001/convert', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setMessage('Operation successful!');
        if (targetFormat === 'txt' && data.text_content !== undefined) {
          setExtractedText(data.text_content);
        } else if (data.output_filename) {
          setDownloadLink(`http://localhost:5001/download/${data.output_filename}`);
        } else {
          setMessage('Operation seems successful but no output information was received.');
        }
      } else {
        setMessage(`Error: ${data.error || response.statusText || 'An unknown server error occurred.'}`);
      }
    } catch (error) {
      setMessage(`An error occurred: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const currentStep = !selectedFile ? 1 : (!targetFormat) ? 2 : 3;
  const isStep3Complete = !isLoading && (downloadLink || extractedText);

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">🗂️</div>
          <div className="tabs">
            {Object.keys(formatOptions).map(tabKey => (
              <button
                key={tabKey}
                className={`tab-button ${activeTab === tabKey ? 'active' : ''}`}
                onClick={() => handleTabChange(tabKey)}
              >
                {formatOptions[tabKey].label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="tab-content">
        <div className="conversion-steps">
          <div className={`step ${currentStep > 1 || isStep3Complete ? 'complete' : currentStep === 1 ? 'active' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-text">Select File</span>
          </div>
          <div className={`step ${currentStep > 2 || isStep3Complete ? 'complete' : currentStep === 2 ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-text">Select Operation</span>
          </div>
          <div className={`step ${isStep3Complete ? 'complete' : currentStep === 3 ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-text">Convert {isStep3Complete ? '& Download/View' : ''}</span>
          </div>
        </div>

        <div
          className={`conversion-form-row ${isDragging ? 'dragging-over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            accept={currentInputAccept}
          />
          <div
            className="step-col choose-files"
            onClick={handleChooseFilesClick} 
          >
            <div className="step-content">
              {selectedFile ? (
                <>
                  <div className="file-preview">
                    {selectedFile.type.startsWith('image/') ? (
                      <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="preview-image" />
                    ) : (
                      <div className="file-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      </div>
                    )}
                  </div>
                  <p className="selected-file-name">{selectedFile.name}</p>
                  <button className="remove-file-button" onClick={handleRemoveFile}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    Remove File
                  </button>
                </>
              ) : (
                <>
                  <div className="upload-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg></div>
                  <button className="choose-files-button">
                    <span>Choose File or Drag & Drop</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="step-col convert-to">
            <div className="step-content">
              <div className="format-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
              </div>
              {!selectedFile ? (
                <p className="placeholder-text">Select a file first</p>
              ) : (
                <>
                  {activeTab === 'ocr' && (
                    <button
                      className={`format-select-button ${targetFormat === 'txt' ? 'selected' : ''}`}
                      onClick={handleOcrSelect}
                      disabled={isLoading || !selectedFile} 
                    >
                      {formatOptions.ocr.output[0].label}
                    </button>
                  )}

                  {activeTab === 'pdf' && (
                    <div className="pdf-operations-menu">
                      {formatOptions.pdf.subOperations.map(op => (
                        <button
                          key={op.id}
                          className={`format-select-button ${selectedPdfOperation === op.id ? 'selected' : ''}`}
                          onClick={() => handlePdfOperationSelect(op.id)}
                          disabled={isLoading || !selectedFile} 
                        >
                          {op.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {(activeTab === 'image' || activeTab === 'video') && (
                    <select
                      id="targetFormat"
                      value={targetFormat}
                      onChange={handleFormatDropdownChange}
                      disabled={isLoading || !selectedFile} 
                      className="format-select"
                    >
                      {(formatOptions[activeTab]?.output || []).map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="step-col convert-now">
            <div className="step-content">
              <div className="convert-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></div>
              {!selectedFile && (<p className="placeholder-text">Ready to convert</p>)}
              {selectedFile && !targetFormat && (<p className="placeholder-text">Select an operation</p>)}
              {selectedFile && targetFormat && (
                <button onClick={handleConvert} disabled={isLoading || !selectedFile || !targetFormat} className="convert-button">
                  {isLoading ? (
                    <><div className="button-spinner"></div><span>Converting...</span></>
                  ) : (
                    <><span>Convert</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"></path></svg></>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="conversion-results">
          {isLoading && (<div className="loading-spinner"></div>)}
          {!isLoading && message && (
            <p className={`status-message ${message.toLowerCase().startsWith('error') ? 'error' : 'success'}`}>{message}</p>
          )}
          {!isLoading && downloadLink && (
            <p>Download converted file <a href={downloadLink} target="_blank" rel="noopener noreferrer" download>here</a>.</p>
          )}
          {!isLoading && extractedText && (
            <div style={{ marginTop: '15px', textAlign: 'left', width: '100%' }}>
              <h3>Extracted Text:</h3>
              <pre>{extractedText}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;