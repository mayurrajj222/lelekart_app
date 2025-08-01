import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, StyleSheet, ActivityIndicator, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { API_BASE } from '../../lib/api';
import {launchImageLibrary} from 'react-native-image-picker';

export default function AddProductScreen({ navigation }) {
  const [form, setForm] = useState({
    name: '',
    brand: '',
    category: '',
    subcategory: '',
    price: '',
    mrp: '',
    purchasePrice: '',
    gstRate: '',
    warranty: '',
    returnPolicy: '',
    description: '',
    specifications: '',
    sku: '',
    stock: '',
    weight: '',
    length: '',
    width: '',
    height: '',
    color: '',
    size: '',
  });
  
  // Add variants state
  const [variants, setVariants] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  // Add variant handling functions
  const addVariant = () => {
    const newVariant = {
      id: Date.now(), // temporary ID for UI
      weight: '',
      color: '',
      size: '',
      price: '',
      stock: '',
      mrp: '',
      sku: '',
    };
    setVariants([...variants, newVariant]);
  };

  const removeVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index, field, value) => {
    const updatedVariants = [...variants];
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    setVariants(updatedVariants);
  };

  const pickImage = async () => {
    let result = await new Promise((resolve, reject) => {
      launchImageLibrary({mediaType: 'photo', quality: 0.7, selectionLimit: 0}, (response) => {
        if (response.didCancel) return resolve({ cancelled: true });
        if (response.errorCode) return reject(response.errorMessage);
        resolve({ cancelled: false, assets: response.assets });
      });
    });
    if (!result.cancelled && result.assets) {
      setImages([...images, ...result.assets.map(a => a.uri)]);
    }
  };

  const validate = () => {
    if (!form.name || form.name.length < 5) return 'Product name must be at least 5 characters';
    if (!form.category) return 'Category is required';
    if (!form.description || form.description.length < 20) return 'Description must be at least 20 characters';
    if (images.length === 0) return 'Please upload at least one product image';
    
    // Validate variants if any exist
    if (variants.length > 0) {
      for (let i = 0; i < variants.length; i++) {
        const variant = variants[i];
        if (!variant.weight || !variant.weight.trim()) {
          return `Variant ${i + 1}: Weight is required`;
        }
        if (!variant.color || !variant.color.trim()) {
          return `Variant ${i + 1}: Color is required`;
        }
        if (!variant.size || !variant.size.trim()) {
          return `Variant ${i + 1}: Size is required`;
        }
        if (!variant.price || isNaN(Number(variant.price)) || Number(variant.price) <= 0) {
          return `Variant ${i + 1}: Price must be a positive number`;
        }
        if (!variant.stock || isNaN(Number(variant.stock)) || Number(variant.stock) < 0) {
          return `Variant ${i + 1}: Stock must be a non-negative number`;
        }
      }
    } else {
      // If no variants, validate main product fields
      if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) return 'Price must be a positive number';
      if (!form.stock || isNaN(Number(form.stock)) || Number(form.stock) < 0) return 'Stock must be a non-negative number';
    }
    
    return null;
  };

  const handleSubmit = async () => {
    const error = validate();
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }
    setLoading(true);
    try {
      // Prepare product data
      const productData = {
        ...form,
        price: variants.length > 0 ? undefined : Number(form.price), // Don't send main price if variants exist
        mrp: form.mrp ? Number(form.mrp) : undefined,
        purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : undefined,
        gstRate: form.gstRate ? Number(form.gstRate) : undefined,
        warranty: form.warranty ? Number(form.warranty) : undefined,
        stock: variants.length > 0 ? undefined : Number(form.stock), // Don't send main stock if variants exist
        weight: form.weight ? Number(form.weight) : undefined,
        length: form.length ? Number(form.length) : undefined,
        width: form.width ? Number(form.width) : undefined,
        height: form.height ? Number(form.height) : undefined,
        images,
        variants: variants.length > 0 ? variants.map(v => ({
          weight: v.weight,
          color: v.color || undefined,
          size: v.size || undefined,
          price: Number(v.price),
          stock: Number(v.stock),
          mrp: v.mrp ? Number(v.mrp) : undefined,
          sku: v.sku || undefined,
        })) : undefined,
      };
      
      const res = await fetch(`${API_BASE}/api/products/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productData }),
      });
      if (!res.ok) throw new Error('Failed to add product');
      Alert.alert('Success', 'Product added successfully');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Add New Product</Text>
      
      {/* Basic Product Information */}
      <Text style={styles.sectionTitle}>Basic Information</Text>
      {Object.entries(form).filter(([field]) => 
        !['price', 'stock', 'mrp', 'purchasePrice'].includes(field)
      ).map(([field, value]) => (
        <View key={field} style={styles.inputGroup}>
          <Text style={styles.label}>{field.charAt(0).toUpperCase() + field.slice(1)}</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={text => handleChange(field, text)}
            placeholder={`Enter ${field}`}
            keyboardType={['gstRate','warranty','weight','length','width','height'].includes(field) ? 'numeric' : 'default'}
            multiline={field === 'description' || field === 'specifications' ? true : false}
            numberOfLines={field === 'description' || field === 'specifications' ? 3 : 1}
          />
        </View>
      ))}

      {/* Product Variants Section */}
      <Text style={styles.sectionTitle}>Product Variants</Text>
      <Text style={styles.sectionDescription}>
        Add different variations of your product (colors, sizes, weights)
      </Text>
      
      {variants.length === 0 ? (
        <View style={styles.noVariantsContainer}>
          <Text style={styles.noVariantsText}>No variants added yet</Text>
          <TouchableOpacity style={styles.addVariantButton} onPress={addVariant}>
            <Icon name="plus" size={20} color="#2874f0" />
            <Text style={styles.addVariantButtonText}>Add First Variant</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          {variants.map((variant, index) => (
            <View key={variant.id} style={styles.variantContainer}>
              <View style={styles.variantHeader}>
                <Text style={styles.variantTitle}>Variant {index + 1}</Text>
                <TouchableOpacity 
                  style={styles.removeVariantButton} 
                  onPress={() => removeVariant(index)}
                >
                  <Icon name="delete" size={20} color="#ff4444" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.variantFields}>
                <View style={styles.variantField}>
                  <Text style={styles.variantLabel}>Weight *</Text>
                  <TextInput
                    style={styles.variantInput}
                    value={variant.weight}
                    onChangeText={(text) => updateVariant(index, 'weight', text)}
                    placeholder="e.g., 250g, 500g, 1kg"
                    keyboardType="default"
                  />
                </View>
                
                <View style={styles.variantField}>
                  <Text style={styles.variantLabel}>Color</Text>
                  <TextInput
                    style={styles.variantInput}
                    value={variant.color}
                    onChangeText={(text) => updateVariant(index, 'color', text)}
                    placeholder="e.g., Red, Blue, Black"
                    keyboardType="default"
                  />
                </View>
                
                <View style={styles.variantField}>
                  <Text style={styles.variantLabel}>Size</Text>
                  <TextInput
                    style={styles.variantInput}
                    value={variant.size}
                    onChangeText={(text) => updateVariant(index, 'size', text)}
                    placeholder="e.g., S, M, L, XL"
                    keyboardType="default"
                  />
                </View>
                
                <View style={styles.variantField}>
                  <Text style={styles.variantLabel}>Price (₹) *</Text>
                  <TextInput
                    style={styles.variantInput}
                    value={variant.price}
                    onChangeText={(text) => updateVariant(index, 'price', text)}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.variantField}>
                  <Text style={styles.variantLabel}>Stock *</Text>
                  <TextInput
                    style={styles.variantInput}
                    value={variant.stock}
                    onChangeText={(text) => updateVariant(index, 'stock', text)}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.variantField}>
                  <Text style={styles.variantLabel}>MRP (₹)</Text>
                  <TextInput
                    style={styles.variantInput}
                    value={variant.mrp}
                    onChangeText={(text) => updateVariant(index, 'mrp', text)}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.variantField}>
                  <Text style={styles.variantLabel}>SKU</Text>
                  <TextInput
                    style={styles.variantInput}
                    value={variant.sku}
                    onChangeText={(text) => updateVariant(index, 'sku', text)}
                    placeholder="SKU"
                    keyboardType="default"
                  />
                </View>
              </View>
            </View>
          ))}
          
          <TouchableOpacity style={styles.addVariantButton} onPress={addVariant}>
            <Icon name="plus" size={20} color="#2874f0" />
            <Text style={styles.addVariantButtonText}>Add Another Variant</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Legacy single product fields (only show if no variants) */}
      {variants.length === 0 && (
        <>
          <Text style={styles.sectionTitle}>Pricing & Stock</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Price (₹) *</Text>
            <TextInput
              style={styles.input}
              value={form.price}
              onChangeText={text => handleChange('price', text)}
              placeholder="Enter price"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Stock *</Text>
            <TextInput
              style={styles.input}
              value={form.stock}
              onChangeText={text => handleChange('stock', text)}
              placeholder="Enter stock quantity"
              keyboardType="numeric"
            />
          </View>
        </>
      )}

      {/* Images Section */}
      <Text style={styles.sectionTitle}>Product Images</Text>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Images</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {images.map((uri, idx) => (
            <Image key={idx} source={{ uri }} style={{ width: 60, height: 60, borderRadius: 8, marginRight: 8, marginBottom: 8 }} />
          ))}
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            <Icon name="plus" size={28} color="#2874f0" />
          </TouchableOpacity>
        </View>
      </View>
      
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Add Product</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafd' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2874f0', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 20, marginBottom: 10 },
  sectionDescription: { fontSize: 14, color: '#666', marginBottom: 15 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 15, color: '#333', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 16, backgroundColor: '#fff' },
  imagePicker: { width: 60, height: 60, borderRadius: 8, borderWidth: 1, borderColor: '#2874f0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e3eafc' },
  submitButton: { backgroundColor: '#2874f0', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  
  // Variant styles
  noVariantsContainer: { 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: '#f0f0f0', 
    borderRadius: 8,
    marginBottom: 10
  },
  noVariantsText: { color: '#666', marginBottom: 10 },
  addVariantButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#e3eafc', 
    padding: 12, 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2874f0'
  },
  addVariantButtonText: { color: '#2874f0', fontWeight: 'bold', marginLeft: 8 },
  variantContainer: { 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8, 
    padding: 15, 
    marginBottom: 15 
  },
  variantHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  variantTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  removeVariantButton: { padding: 5 },
  variantFields: { gap: 10 },
  variantField: { marginBottom: 10 },
  variantLabel: { fontSize: 14, color: '#333', marginBottom: 5 },
  variantInput: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 6, 
    padding: 8, 
    fontSize: 14, 
    backgroundColor: '#fff' 
  },
}); 