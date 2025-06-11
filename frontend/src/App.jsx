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
      { value: 'heic', label: 'HEIC' },
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
    label: 'İmage to Text (OCR)',
    inputAccept: 'image/*,.pdf',
     output: [
        { value: 'txt', label: 'Text (OCR)' },
     ],
  },
  pdf: {
    label: 'PDF Tools',
    inputAccept: '.pdf',
    subOperations: [
      { id: 'pdf-to-docx', label: 'Word (DOCX)', targetFormat: 'docx' },
    ],
  },
};

function App() {
  const [activeTab, setActiveTab] = useState('image');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [targetFormat, setTargetFormat] = useState('');
  const [selectedPdfOperation, setSelectedPdfOperation] = useState('');
  const [conversionResults, setConversionResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  const currentTabOptions = useMemo(() => formatOptions[activeTab], [activeTab]);
  const currentInputAccept = useMemo(() => currentTabOptions?.inputAccept || '*/*', [currentTabOptions]);

  const resetApplicationStates = () => {
    setSelectedFiles([]);
    setTargetFormat('');
    setSelectedPdfOperation('');
    setConversionResults({});
    setIsLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    resetApplicationStates();
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const commonFileSelectActions = (newlySelectedFileList) => {
    const newFilesArray = Array.from(newlySelectedFileList);

    setSelectedFiles(prevFiles => {
      const existingFileNames = new Set(prevFiles.map(f => f.name));
      const uniqueNewFiles = newFilesArray.filter(newFile => !existingFileNames.has(newFile.name));
      return [...prevFiles, ...uniqueNewFiles];
    });

    setConversionResults({});

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    commonFileSelectActions(event.dataTransfer.files);
  };

  const handleFileChange = (event) => {
    commonFileSelectActions(event.target.files);
  };

  const handleRemoveFile = (fileNameToRemove) => {
    setSelectedFiles(prevFiles => prevFiles.filter(file => file.name !== fileNameToRemove));
    setConversionResults(prevResults => {
      const newResults = {...prevResults};
      delete newResults[fileNameToRemove];
      if (Object.keys(newResults).length === 1 && newResults.global) {
        delete newResults.global;
      }
      return newResults;
    });
  };

  const handleClearAllFiles = () => {
    setSelectedFiles([]);
    setConversionResults({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFormatDropdownChange = (event) => {
    const format = event.target.value;
    setTargetFormat(format);
    setSelectedPdfOperation('');
    setConversionResults({});
  };

  const handlePdfOperationSelect = (operationId) => {
    const operation = formatOptions.pdf.subOperations.find(op => op.id === operationId);
    if (operation) {
      setSelectedPdfOperation(operationId);
      setTargetFormat(operation.targetFormat);
      setConversionResults({});
    }
  };

  const handleOcrSelect = () => {
    setTargetFormat('txt');
    setSelectedPdfOperation('');
    setConversionResults({});
  };

  const handleConvert = async () => {
    if (selectedFiles.length === 0) {
      setConversionResults({ global: { message: 'Please select at least one file.', type: 'error' } });
      return;
    }
    if (!targetFormat) {
      setConversionResults({ global: { message: 'Please select a target format or operation.', type: 'error' } });
      return;
    }

    setIsLoading(true);
    setConversionResults({ global: { message: `Processing ${selectedFiles.length} file(s)...`, type: 'info' } });

    let currentBatchResults = {};

    for (const file of selectedFiles) {
      currentBatchResults[file.name] = { message: `Converting ${file.name}...`, type: 'info', link: null, text_content: null };
      setConversionResults(prev => ({...prev, ...currentBatchResults}));

      const formData = new FormData();
      formData.append('file', file);
      formData.append('target_format', targetFormat);

      try {
        const response = await fetch('/convert', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();

        if (response.ok && data.success) {
          currentBatchResults[file.name] = {
            message: `${file.name} converted successfully!`,
            type: 'success',
            link: data.output_filename ? `/download/${data.output_filename}` : null,
            text_content: data.text_content || null
          };
        } else {
          currentBatchResults[file.name] = {
            message: `Error converting ${file.name}: ${data.error || response.statusText || 'Unknown server error.'}`,
            type: 'error',
            link: null,
            text_content: null
          };
        }
      } catch (error) {
        currentBatchResults[file.name] = {
          message: `Error converting ${file.name}: ${error.message}`,
          type: 'error',
          link: null,
          text_content: null
        };
      }
      setConversionResults(prev => ({...prev, ...currentBatchResults}));
    }

    currentBatchResults.global = { message: 'All files processed.', type: 'info'};
    setConversionResults(prev => ({...prev, ...currentBatchResults}));
    setIsLoading(false);
  };
  
  const currentStep = selectedFiles.length === 0 ? 1 : (!targetFormat) ? 2 : 3;
  const isStep3Complete = !isLoading &&
                          Object.keys(conversionResults).length > (conversionResults.global ? 1:0) &&
                          !Object.values(conversionResults).some(r => r.type === 'info' && r.message.startsWith('Converting'));

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
            <span className="step-text">Select File(s)</span>
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
            multiple
          />
          <div
            className="step-col choose-files"
            onClick={() => { if (selectedFiles.length === 0) triggerFileInput();}}
          >
            <div className={`step-content ${selectedFiles.length > 0 ? 'has-files' : ''}`}>
              {selectedFiles.length > 0 ? (
                <div className="selected-files-wrapper">
                  <div className="selected-files-container">
                    <p>{selectedFiles.length} file(s) selected:</p>
                    <ul className="selected-files-list">
                      {selectedFiles.map(file => (
                        <li key={file.name}>
                          <span className="file-list-name">{file.name}</span>
                          <span className="file-list-size">({ (file.size / 1024).toFixed(2) } KB)</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveFile(file.name);}}
                            className="remove-individual-file-button"
                            title="Remove this file"
                          >
                            &times;
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="file-actions-buttons">
                    <button
                      className="action-button add-more-button"
                      onClick={(e) => { e.stopPropagation(); triggerFileInput(); }}
                    >
                      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                      Add More Files
                    </button>
                    <button
                      className="action-button clear-all-button"
                      onClick={(e) => { e.stopPropagation(); handleClearAllFiles();}}
                    >
                      <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      Clear All Files
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="upload-icon"><svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg></div>
                  <button className="choose-files-button-main" onClick={(e) => { e.stopPropagation(); triggerFileInput();}}>
                    <span>Choose File(s) or Drag & Drop</span>
                    <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
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
              {selectedFiles.length === 0 ? (
                <p className="placeholder-text">Select file(s) first</p>
              ) : (
                <>
                  {activeTab === 'ocr' && (
                    <button
                      className={`format-select-button ${targetFormat === 'txt' ? 'selected' : ''}`}
                      onClick={handleOcrSelect}
                      disabled={isLoading || selectedFiles.length === 0}
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
                          disabled={isLoading || selectedFiles.length === 0}
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
                      disabled={isLoading || selectedFiles.length === 0}
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
              {selectedFiles.length === 0 && (<p className="placeholder-text">Ready to convert</p>)}
              {selectedFiles.length > 0 && !targetFormat && (<p className="placeholder-text">Select an operation</p>)}
              {selectedFiles.length > 0 && targetFormat && (
                <button onClick={handleConvert} disabled={isLoading || selectedFiles.length === 0 || !targetFormat} className="convert-button">
                  {isLoading ? (
                    <><div className="button-spinner"></div><span>Processing...</span></>
                  ) : (
                    <><span>Convert File(s)</span><svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"></path></svg></>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="conversion-results">
          {isLoading &&
            Object.values(conversionResults).filter(r => r.type === 'info' && r.message.startsWith('Converting')).length === 0 &&
            !conversionResults.global?.message.startsWith('All files') &&
            (<div className="loading-spinner"></div>)
          }

          {conversionResults.global && (
            <p className={`status-message global-status-${conversionResults.global.type}`}>
              {conversionResults.global.message}
            </p>
          )}

          {Object.entries(conversionResults).map(([fileName, result]) => {
            if (fileName === 'global') return null;
            return (
              <div key={fileName} className={`file-result-entry result-type-${result.type}`}>
                <div className="file-result-header">
                  <span className="file-result-name">{fileName}</span>
                  <span className={`file-result-status-badge status-${result.type}`}>
                    {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                  </span>
                </div>
                <p className="file-result-message">{result.message.replace(`${fileName} converted successfully!`, 'Conversion successful!').replace(`Error converting ${fileName}:`, 'Error:')}</p>
                {result.link && (
                  <p className="download-section">
                    <a href={result.link} target="_blank" rel="noopener noreferrer" download className="download-link-button">
                      Download Output
                    </a>
                  </p>
                )}
                {result.text_content && (
                  <div className="extracted-text-container">
                    <h4>Extracted Text:</h4>
                    <pre>{result.text_content}</pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;