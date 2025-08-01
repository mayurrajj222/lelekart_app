import React, { useState, useRef, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE } from '../../lib/api';
// Document picker functionality will be implemented with native modules

const { width } = Dimensions.get('window');

export default function SellerBulkImportScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingState, setProcessingState] = useState('idle'); // idle, uploading, processing, complete, error
  const [uploadResults, setUploadResults] = useState(null);
  const [showTemplate, setShowTemplate] = useState(false);

  const pickDocument = async () => {
    // For now, we'll simulate file selection
    // In a real implementation, you would integrate with a native document picker
    Alert.alert(
      'File Selection',
      'Document picker will be implemented with native modules. For now, you can prepare your CSV file and use the template below.',
      [
        { text: 'OK' },
        { text: 'View Template', onPress: () => setShowTemplate(true) }
      ]
    );
    
    // Simulate file selection for demo purposes
    const mockFile = {
      name: 'sample_products.csv',
      size: 2048,
      type: 'text/csv'
    };
    
    setSelectedFile(mockFile);
    setProcessingState('idle');
    setUploadResults(null);
    setUploadProgress(0);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setProcessingState('idle');
    setUploadProgress(0);
    setUploadResults(null);
  };

  const uploadFile = async () => {
    if (!selectedFile) {
      Alert.alert('No File', 'Please select a file to upload');
      return;
    }

    setProcessingState('uploading');
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Simulate API call for demo purposes
      await new Promise(resolve => setTimeout(resolve, 2000));

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Mock successful response
      const mockData = {
        successful: 23,
        failed: 2,
        errors: [
          { row: 5, field: 'price', message: 'Invalid price format' },
          { row: 12, field: 'category', message: 'Category not found' }
        ],
        products: [
          { id: 1, name: 'Product 1', price: 100, status: 'active' },
          { id: 2, name: 'Product 2', price: 200, status: 'active' },
          { id: 3, name: 'Product 3', price: 150, status: 'active' }
        ]
      };

      setProcessingState('complete');
      setUploadResults(mockData);

      Alert.alert(
        'Import Complete',
        `Successfully imported ${mockData.successful} products. ${mockData.failed} products failed to import.`
      );

    } catch (error) {
      console.error('Upload error:', error);
      setProcessingState('error');
      setUploadProgress(0);
      setUploadResults({
        successful: 0,
        failed: 1,
        errors: [{ row: 0, message: error.message }],
        products: [],
      });
      Alert.alert('Upload Failed', error.message);
    }
  };

  const downloadTemplate = () => {
    // In a real app, this would download a CSV template
    Alert.alert(
      'Download Template',
      'Template download feature will be implemented. For now, use the sample format shown below.',
      [
        { text: 'OK' },
        { text: 'View Sample', onPress: () => setShowTemplate(true) }
      ]
    );
  };

  const getProcessingStateText = () => {
    switch (processingState) {
      case 'uploading':
        return 'Uploading file...';
      case 'processing':
        return 'Processing data...';
      case 'complete':
        return 'Import completed';
      case 'error':
        return 'Import failed';
      default:
        return 'Ready to upload';
    }
  };

  const getProcessingStateColor = () => {
    switch (processingState) {
      case 'uploading':
      case 'processing':
        return '#2196F3';
      case 'complete':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      default:
        return '#666';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bulk Import Products</Text>
        <Text style={styles.headerSubtitle}>
          Upload CSV or Excel file to add multiple products at once
        </Text>
      </View>

      {/* File Upload Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upload File</Text>
        
        {!selectedFile ? (
          <TouchableOpacity style={styles.uploadArea} onPress={pickDocument}>
            <Icon name="cloud-upload-outline" size={48} color="#2874f0" />
            <Text style={styles.uploadText}>Tap to select file</Text>
            <Text style={styles.uploadSubtext}>Supports CSV and Excel files</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.fileInfo}>
            <View style={styles.fileDetails}>
              <Icon name="file-document-outline" size={24} color="#2874f0" />
              <View style={styles.fileText}>
                <Text style={styles.fileName}>{selectedFile.name}</Text>
                <Text style={styles.fileSize}>
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={removeFile} style={styles.removeButton}>
              <Icon name="close" size={20} color="#F44336" />
            </TouchableOpacity>
          </View>
        )}

        {/* Progress Bar */}
        {processingState !== 'idle' && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>{getProcessingStateText()}</Text>
              <Text style={styles.progressPercent}>{uploadProgress}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${uploadProgress}%`,
                    backgroundColor: getProcessingStateColor()
                  }
                ]} 
              />
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={downloadTemplate}
          >
            <Icon name="download" size={20} color="#2874f0" />
            <Text style={styles.secondaryButtonText}>Download Template</Text>
          </TouchableOpacity>
          
          {selectedFile && processingState === 'idle' && (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={uploadFile}
            >
              <Icon name="upload" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Upload & Process</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results Section */}
      {uploadResults && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Import Results</Text>
          
          <View style={styles.resultsGrid}>
            <View style={styles.resultCard}>
              <Icon name="check-circle" size={24} color="#4CAF50" />
              <Text style={styles.resultNumber}>{uploadResults.successful}</Text>
              <Text style={styles.resultLabel}>Successful</Text>
            </View>
            <View style={styles.resultCard}>
              <Icon name="close-circle" size={24} color="#F44336" />
              <Text style={styles.resultNumber}>{uploadResults.failed}</Text>
              <Text style={styles.resultLabel}>Failed</Text>
            </View>
          </View>

          {/* Error Details */}
          {uploadResults.errors && uploadResults.errors.length > 0 && (
            <View style={styles.errorSection}>
              <Text style={styles.errorTitle}>Errors Found:</Text>
              <ScrollView style={styles.errorList}>
                {uploadResults.errors.map((error, index) => (
                  <View key={index} style={styles.errorItem}>
                    <Text style={styles.errorRow}>Row {error.row}:</Text>
                    <Text style={styles.errorMessage}>{error.message}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      {/* Template Sample */}
      {showTemplate && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CSV Template Format</Text>
          <View style={styles.templateContainer}>
            <Text style={styles.templateText}>
              name,description,price,stock,category,subcategory,sku{'\n'}
              "Product Name","Product Description",999,100,"Electronics","Smartphones","SKU001"{'\n'}
              "Another Product","Another Description",1499,50,"Fashion","Clothing","SKU002"
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeTemplateButton}
            onPress={() => setShowTemplate(false)}
          >
            <Text style={styles.closeTemplateText}>Close</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        <View style={styles.instructionsList}>
          <View style={styles.instructionItem}>
            <Icon name="numeric-1-circle" size={20} color="#2874f0" />
            <Text style={styles.instructionText}>
              Download the template or use the sample format above
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Icon name="numeric-2-circle" size={20} color="#2874f0" />
            <Text style={styles.instructionText}>
              Fill in your product data following the template structure
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Icon name="numeric-3-circle" size={20} color="#2874f0" />
            <Text style={styles.instructionText}>
              Save as CSV or Excel format and upload here
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Icon name="numeric-4-circle" size={20} color="#2874f0" />
            <Text style={styles.instructionText}>
              Review the results and fix any errors if needed
            </Text>
          </View>
        </View>
      </View>

      {/* Tips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tips for Success</Text>
        <View style={styles.tipsList}>
          <View style={styles.tipItem}>
            <Icon name="lightbulb-outline" size={16} color="#FF9800" />
            <Text style={styles.tipText}>
              Ensure all required fields are filled (name, price, stock)
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Icon name="lightbulb-outline" size={16} color="#FF9800" />
            <Text style={styles.tipText}>
              Use proper category and subcategory names from the platform
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Icon name="lightbulb-outline" size={16} color="#FF9800" />
            <Text style={styles.tipText}>
              Keep file size under 5MB for faster processing
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafd',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2874f0',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2874f0',
    marginBottom: 16,
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: '#2874f0',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2874f0',
    marginTop: 12,
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  fileDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileText: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  fileSize: {
    fontSize: 12,
    color: '#666',
  },
  removeButton: {
    padding: 8,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#333',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2874f0',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#2874f0',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  secondaryButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#2874f0',
  },
  secondaryButtonText: {
    color: '#2874f0',
    fontWeight: '500',
  },
  resultsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  resultCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  resultNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  errorSection: {
    marginTop: 16,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#F44336',
    marginBottom: 8,
  },
  errorList: {
    maxHeight: 200,
  },
  errorItem: {
    flexDirection: 'row',
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 4,
  },
  errorRow: {
    fontSize: 12,
    fontWeight: '500',
    color: '#F44336',
    marginRight: 8,
  },
  errorMessage: {
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
  templateContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  templateText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
    lineHeight: 18,
  },
  closeTemplateButton: {
    alignSelf: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2874f0',
    borderRadius: 6,
  },
  closeTemplateText: {
    color: '#fff',
    fontWeight: '500',
  },
  instructionsList: {
    gap: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
}); 