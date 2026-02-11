'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import DocumentUpload from '@/components/DocumentUpload';

// Base schema for all users
const basePropertySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.string().min(1, 'Price is required'),
  location: z.string().min(1, 'Location is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  plotSize: z.string().min(1, 'Plot size is required'),
  plotSizeUnit: z.enum(['sqyd', 'sqft', 'acre']),
  propertyType: z.enum(['residential', 'commercial', 'agricultural', 'industrial']),
});

// Owner schema adds contact number
const ownerPropertySchema = basePropertySchema.extend({
  ownerContactNumber: z.string().min(10, 'Valid contact number is required').max(15),
});

// Staff schema (same as base for now)
const staffPropertySchema = basePropertySchema;

type OwnerPropertyFormData = z.infer<typeof ownerPropertySchema>;
type StaffPropertyFormData = z.infer<typeof staffPropertySchema>;

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddPropertyModal: React.FC<AddPropertyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<'details' | 'documents'>('details');
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<{
    nationalId: boolean;
    registration: boolean;
    photos: number;
  }>({ nationalId: false, registration: false, photos: 0 });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { user } = useAuth();

  // Determine if user is staff (admin, manager, or agent) or owner
  const isStaff = user?.role && ['admin', 'manager', 'agent'].includes(user.role);
  const isOwner = user?.role === 'owner';
  
  // Use appropriate schema based on user role
  const schema = isStaff ? staffPropertySchema : ownerPropertySchema;

  const form = useForm<OwnerPropertyFormData | StaffPropertyFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      price: '',
      location: '',
      city: '',
      state: '',
      plotSize: '',
      plotSizeUnit: 'sqyd',
      propertyType: 'residential',
      ...(isStaff ? {} : { ownerContactNumber: '' }),
    },
  });

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = selectedImages.length + files.length;

    if (totalImages > 10) {
      toast({
        title: 'Too Many Images',
        description: 'You can upload a maximum of 10 images',
        variant: 'destructive',
      });
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid File',
          description: `${file.name} is not an image file`,
          variant: 'destructive',
        });
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: `${file.name} exceeds 10MB limit`,
          variant: 'destructive',
        });
        return false;
      }
      return true;
    });

    // Add new files
    setSelectedImages(prev => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove image
  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Upload images to Supabase storage
  const uploadImages = async (propertyId: string): Promise<string[]> => {
    const uploadPromises = selectedImages.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', 'property_photo');

      const response = await fetch(`/api/properties/${propertyId}/documents`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload ${file.name}`);
      }

      const data = await response.json();
      return data.document.fileUrl;
    });

    return Promise.all(uploadPromises);
  };

  const onSubmit = async (data: OwnerPropertyFormData | StaffPropertyFormData) => {
    try {
      setIsSubmitting(true);

      // For owners, validate that at least one image is selected
      if (isOwner && selectedImages.length === 0) {
        toast({
          title: 'Images Required',
          description: 'Please upload at least one property image',
          variant: 'destructive',
        });
        return;
      }

      const requestBody: any = {
        title: data.title,
        description: data.description,
        price: parseFloat(data.price),
        location: data.location,
        city: data.city,
        state: data.state,
        plotSize: parseFloat(data.plotSize),
        plotSizeUnit: data.plotSizeUnit,
        propertyType: data.propertyType,
        isStaffCreated: isStaff,
        images: [], // Will be updated after upload
      };

      // Add owner contact number for non-staff users
      if (!isStaff && 'ownerContactNumber' in data) {
        requestBody.ownerContactNumber = data.ownerContactNumber;
      }

      // Call API to create property
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create property');
      }

      const propertyId = result.property.id;

      // Upload images if any selected
      if (selectedImages.length > 0) {
        setUploadingImages(true);
        try {
          const imageUrls = await uploadImages(propertyId);
          
          // Update property with image URLs
          const updateResponse = await fetch(`/api/properties/${propertyId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ images: imageUrls }),
          });

          if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            console.error('Failed to update property images:', errorData);
            throw new Error('Failed to update property with images');
          }

          const updateResult = await updateResponse.json();
          console.log('Property images updated successfully:', updateResult);
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          toast({
            title: 'Image Upload Warning',
            description: 'Property created but some images failed to upload',
            variant: 'destructive',
          });
        } finally {
          setUploadingImages(false);
        }
      }

      // For staff, move to document upload step
      if (isStaff) {
        setCreatedPropertyId(propertyId);
        setCurrentStep('documents');
        toast({
          title: 'Property Created!',
          description: 'Now upload documents to complete the listing.',
        });
      } else {
        // For owners, close modal immediately
        toast({
          title: 'Property Listed!',
          description: 'Your property has been submitted for verification.',
        });
        form.reset();
        setSelectedImages([]);
        setImagePreviews([]);
        onSuccess?.();
        onClose();
      }
    } catch (error: any) {
      console.error('Property submission error:', error);
      toast({
        title: 'Submission Failed',
        description: error.message || 'Failed to create property. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDocumentUploaded = (documentType: 'nationalId' | 'registration' | 'photo') => {
    setUploadedDocuments(prev => ({
      ...prev,
      [documentType]: documentType === 'photo' ? prev.photos + 1 : true,
    }));
  };

  const handleFinishDocuments = () => {
    toast({
      title: 'Property Listing Complete!',
      description: 'Your property has been added and verified.',
    });
    form.reset();
    setCurrentStep('details');
    setCreatedPropertyId(null);
    setUploadedDocuments({ nationalId: false, registration: false, photos: 0 });
    setSelectedImages([]);
    setImagePreviews([]);
    onSuccess?.();
    onClose();
  };

  const handleSkipDocuments = () => {
    toast({
      title: 'Property Created',
      description: 'You can upload documents later from the property details page.',
    });
    form.reset();
    setCurrentStep('details');
    setCreatedPropertyId(null);
    setUploadedDocuments({ nationalId: false, registration: false, photos: 0 });
    setSelectedImages([]);
    setImagePreviews([]);
    onSuccess?.();
    onClose();
  };

  const FormContent = (
    <Form {...form}>
      {currentStep === 'details' ? (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 200 Sq Yd Residential Plot in Whitefield" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe your property in detail..." 
                    rows={3}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 grid-cols-2">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="4500000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="propertyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="agricultural">Agricultural</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 grid-cols-2">
            <FormField
              control={form.control}
              name="plotSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plot Size</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="200" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="plotSizeUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="sqyd">Sq Yards</SelectItem>
                      <SelectItem value="sqft">Sq Feet</SelectItem>
                      <SelectItem value="acre">Acres</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location / Area</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Whitefield" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 grid-cols-2">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Bangalore" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Karnataka" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Owner Contact Number - Only for non-staff users */}
          {!isStaff && (
            <FormField
              control={form.control}
              name="ownerContactNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner Contact Number</FormLabel>
                  <FormControl>
                    <Input 
                      type="tel" 
                      placeholder="Enter property owner's contact number" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    This number will be used for property-related inquiries
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Image Upload Section */}
          <div className="space-y-3 pt-2 border-t">
            <FormLabel className="text-base">
              Property Images {isOwner && <span className="text-destructive">*</span>}
            </FormLabel>
            <FormDescription>
              Upload up to 10 images of your property. Images should be clear and show different angles of the property.
            </FormDescription>
            
            {/* Image Preview Grid */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                    <Image
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            {selectedImages.length < 10 && (
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                  id="property-images"
                />
                <label htmlFor="property-images">
                  <Button type="button" variant="outline" className="w-full" asChild>
                    <span>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      {selectedImages.length === 0 ? 'Upload Images' : `Add More Images (${selectedImages.length}/10)`}
                    </span>
                  </Button>
                </label>
              </div>
            )}
            
            {selectedImages.length >= 10 && (
              <p className="text-sm text-muted-foreground text-center">
                Maximum of 10 images reached
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting || uploadingImages}>
              {isSubmitting || uploadingImages ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploadingImages ? 'Uploading Images...' : 'Submitting...'}
                </>
              ) : isStaff ? (
                'Create & Add Documents'
              ) : (
                'List Property'
              )}
            </Button>
          </div>
        </form>
      ) : (
        /* Document Upload Step - Only for staff */
        <div className="space-y-6">
          <div className="text-center space-y-2 pb-4 border-b">
            <h3 className="font-semibold">Upload Property Documents</h3>
            <p className="text-sm text-muted-foreground">
              Upload required documents to complete the property listing
            </p>
          </div>

          <Tabs defaultValue="national-id" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="national-id">
                National ID {uploadedDocuments.nationalId && '✓'}
              </TabsTrigger>
              <TabsTrigger value="registration">
                Registration {uploadedDocuments.registration && '✓'}
              </TabsTrigger>
              <TabsTrigger value="photos">
                Photos ({uploadedDocuments.photos})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="national-id" className="space-y-4 mt-4">
              {createdPropertyId && (
                <DocumentUpload
                  propertyId={createdPropertyId}
                  documentType="owner_national_id"
                  label="Owner's National ID"
                  description="Upload a clear copy of the property owner's government-issued ID"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onUploadComplete={() => handleDocumentUploaded('nationalId')}
                />
              )}
            </TabsContent>

            <TabsContent value="registration" className="space-y-4 mt-4">
              {createdPropertyId && (
                <DocumentUpload
                  propertyId={createdPropertyId}
                  documentType="property_registration"
                  label="Property Registration Documents"
                  description="Upload property title deed, registration papers, or ownership documents"
                  accept=".jpg,.jpeg,.png,.pdf"
                  multiple
                  onUploadComplete={() => handleDocumentUploaded('registration')}
                />
              )}
            </TabsContent>

            <TabsContent value="photos" className="space-y-4 mt-4">
              {createdPropertyId && (
                <DocumentUpload
                  propertyId={createdPropertyId}
                  documentType="property_photo"
                  label="Property Photos"
                  description="Upload clear photos of the property from different angles"
                  accept=".jpg,.jpeg,.png"
                  multiple
                  onUploadComplete={() => handleDocumentUploaded('photo')}
                />
              )}
            </TabsContent>
          </Tabs>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleSkipDocuments} 
              className="w-full sm:w-auto"
            >
              Skip for Now
            </Button>
            <Button 
              type="button"
              onClick={handleFinishDocuments} 
              className="w-full sm:w-auto"
              disabled={!uploadedDocuments.nationalId && !uploadedDocuments.registration && uploadedDocuments.photos === 0}
            >
              Finish
            </Button>
          </div>
        </div>
      )}
    </Form>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="px-4 pb-6 max-h-[90vh] overflow-y-auto">
          <DrawerHeader className="px-0">
            <DrawerTitle className="font-display">
              {currentStep === 'details' ? 'Add New Property' : 'Upload Documents'}
            </DrawerTitle>
            <DrawerDescription>
              {currentStep === 'details' 
                ? isStaff 
                  ? 'Fill in the details to create a verified property listing'
                  : 'Fill in the details to list your property'
                : 'Add supporting documents for verification'
              }
            </DrawerDescription>
          </DrawerHeader>
          {FormContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {currentStep === 'details' ? 'Add New Property' : 'Upload Documents'}
          </DialogTitle>
          <DialogDescription>
            {currentStep === 'details'
              ? isStaff
                ? 'Fill in the details to create a verified property listing'
                : 'Fill in the details to list your property for sale'
              : 'Add supporting documents for verification'
            }
          </DialogDescription>
        </DialogHeader>
        {FormContent}
      </DialogContent>
    </Dialog>
  );
};
