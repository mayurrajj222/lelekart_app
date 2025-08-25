import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { countries } from "@/lib/countries";
import { Upload } from "lucide-react";
import { SubmitHandler } from "react-hook-form";

// Form validation schema
const careerFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  fatherName: z.string().min(2, "Father's name must be at least 2 characters"),
  maritalStatus: z.enum(["Single", "Married", "Divorced", "Widowed"]),
  address: z.string().min(10, "Please enter a complete address"),
  highestQualification: z
    .string()
    .min(2, "Please enter your highest qualification"),
  specialization: z.string().min(2, "Please enter your specialization"),
  workExperience: z.string().min(1, "Please enter your work experience"),
  idNumber: z.string().min(1, "Please enter your valid ID number"),
  email: z.string().email("Please enter a valid email address"),
  country: z.string().min(1, "Please select your country"),
  position: z.string().min(1, "Please select a position"),
  phoneCode: z.string().min(1, "Please select a country code"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  whatsappCode: z.string().min(1, "Please select a country code"),
  whatsappNumber: z
    .string()
    .min(10, "WhatsApp number must be at least 10 digits"),
  message: z.string().min(10, "Please explain why you should be hired"),
  resume: z.any().optional(),
});

type CareerFormValues = z.infer<typeof careerFormSchema>;

export default function CareersPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Store the entire result of useForm in a variable 'form'
  const form = useForm<CareerFormValues>({
    resolver: zodResolver(careerFormSchema),
    defaultValues: {
      name: "",
      fatherName: "",
      maritalStatus: "Single",
      address: "",
      highestQualification: "",
      specialization: "",
      workExperience: "",
      idNumber: "",
      email: "",
      country: "",
      position: "",
      phoneCode: "+91",
      phoneNumber: "",
      whatsappCode: "+91",
      whatsappNumber: "",
      message: "",
    },
  });

  // Destructure necessary methods and state from the form object for direct use
  const {
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = form;

  // Function to reset the form, preserving phone codes
  const resetForm = () => {
    form.reset({
      name: "",
      fatherName: "",
      maritalStatus: "Single",
      address: "",
      highestQualification: "",
      specialization: "",
      workExperience: "",
      idNumber: "",
      email: "",
      country: "",
      position: "",
      phoneCode: form.getValues("phoneCode"),
      phoneNumber: "",
      whatsappCode: form.getValues("whatsappCode"),
      whatsappNumber: "",
      message: "",
      resume: undefined,
    });
  };

  const onSubmit: SubmitHandler<CareerFormValues> = async (data) => {
    setIsSubmitting(true);
    const formData = new FormData();

    // Append all form fields to FormData
    Object.keys(data).forEach((key) => {
      // Skip file type for now, handle separately
      if (key !== "resume") {
        formData.append(key, (data as any)[key]);
      }
    });

    // Add phone field by combining code and number
    formData.append("phone", `${data.phoneCode}${data.phoneNumber}`);

    // Append the resume file if it exists
    if (data.resume) {
      formData.append("resume", data.resume);
    }

    try {
      const response = await fetch("/api/careers/submit", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Application Submitted",
          description:
            result.message ||
            "Your application has been submitted successfully.",
          variant: "success",
        });
        resetForm(); // Reset form on success
      } else {
        toast({
          title: "Submission Failed",
          description:
            result.error || "There was an error submitting your application.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      toast({
        title: "Submission Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F5E4] text-gray-800 py-4">
      <div className="container mx-auto px-4">
        <div className="bg-[#F8F5E4] shadow-sm rounded-md overflow-hidden mb-6">
          {/* Hero Banner */}
          <div className="bg-[#2874f0] text-white p-6 md:p-8 lg:p-16">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
                Join Our Team
              </h1>
              <p className="text-base md:text-lg lg:text-xl mb-4 md:mb-6">
                Kindly fill out the form below to apply for a position at
                Lelekart.
              </p>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-4 md:p-6 lg:p-8">
            <div className="max-w-3xl mx-auto">
              <Form {...form}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Personal Information Section */}
                  <div className="space-y-4">
                    <h2 className="text-lg md:text-xl font-semibold">
                      Personal Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm md:text-base">
                              Full Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your full name"
                                {...field}
                                className="text-sm md:text-base"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="fatherName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm md:text-base">
                              Father's Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your father's name"
                                {...field}
                                className="text-sm md:text-base"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="maritalStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm md:text-base">
                              Marital Status
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="text-sm md:text-base">
                                  <SelectValue placeholder="Select marital status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Single">Single</SelectItem>
                                <SelectItem value="Married">Married</SelectItem>
                                <SelectItem value="Divorced">
                                  Divorced
                                </SelectItem>
                                <SelectItem value="Widowed">Widowed</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="address"
                        render={({ field }) => (
                          <FormItem className="col-span-1 md:col-span-2">
                            <FormLabel className="text-sm md:text-base">
                              Address
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter your full address"
                                {...field}
                                rows={3}
                                className="text-sm md:text-base"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Education & Experience Section */}
                  <div className="space-y-4">
                    <h2 className="text-lg md:text-xl font-semibold">
                      Education & Experience
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={control}
                        name="position"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm md:text-base">
                              Position Applied For
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="text-sm md:text-base">
                                  <SelectValue placeholder="Select position" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Software Developer">
                                  Software Developer
                                </SelectItem>
                                <SelectItem value="UI/UX Designer">
                                  UI/UX Designer
                                </SelectItem>
                                <SelectItem value="Product Manager">
                                  Product Manager
                                </SelectItem>
                                <SelectItem value="Business Analyst">
                                  Business Analyst
                                </SelectItem>
                                <SelectItem value="Marketing Executive">
                                  Marketing Executive
                                </SelectItem>
                                <SelectItem value="Customer Support">
                                  Customer Support
                                </SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="highestQualification"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm md:text-base">
                              Highest Qualification
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Bachelor's Degree"
                                {...field}
                                className="text-sm md:text-base"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="specialization"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm md:text-base">
                              Specialization
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Computer Science"
                                {...field}
                                className="text-sm md:text-base"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="workExperience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm md:text-base">
                              Total Work Experience (Years)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="e.g., 2"
                                {...field}
                                min={0}
                                className="text-sm md:text-base"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="idNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm md:text-base">
                              Valid ID Number (Aadhar/PAN)
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter ID number"
                                {...field}
                                className="text-sm md:text-base"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Contact Information Section */}
                  <div className="space-y-4">
                    <h2 className="text-lg md:text-xl font-semibold">
                      Contact Information
                    </h2>

                    <FormField
                      control={control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm md:text-base">
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your email"
                              {...field}
                              className="text-sm md:text-base"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Country, Phone, and WhatsApp - Combined */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      {/* Country Select */}
                      <FormField
                        control={control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm md:text-base">
                              Country
                            </FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                const selectedCountry = countries.find(
                                  (c) => c.code === value
                                );
                                if (selectedCountry) {
                                  setValue(
                                    "phoneCode",
                                    selectedCountry.dialCode
                                  );
                                  setValue(
                                    "whatsappCode",
                                    selectedCountry.dialCode
                                  );
                                }
                              }}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="text-sm md:text-base">
                                  <SelectValue placeholder="Select your country" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {countries.map((country) => (
                                  <SelectItem
                                    key={country.code}
                                    value={country.code}
                                  >
                                    {country.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Phone Number Input */}
                      <FormField
                        control={control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm md:text-base">
                              Phone Number
                            </FormLabel>
                            <div className="mt-1 flex rounded-md shadow-sm">
                              <div className="relative flex items-stretch flex-grow">
                                <div className="absolute inset-y-0 left-0 flex items-center">
                                  <span className="text-gray-500 text-xs md:text-sm pl-3 pr-2 border-r border-gray-300">
                                    {watch("phoneCode") || "+91"}
                                  </span>
                                </div>
                                <Input
                                  type="tel"
                                  className="block w-full rounded-md border-gray-300 pl-16 focus:border-primary-500 focus:ring-primary-500 text-sm md:text-base"
                                  placeholder="Enter phone number"
                                  {...field} // Bind field props
                                />
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* WhatsApp Number Input */}
                      <FormField
                        control={control}
                        name="whatsappNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm md:text-base">
                              WhatsApp Number
                            </FormLabel>
                            <div className="mt-1 flex rounded-md shadow-sm">
                              <div className="relative flex items-stretch flex-grow">
                                <div className="absolute inset-y-0 left-0 flex items-center">
                                  <span className="text-gray-500 text-xs md:text-sm pl-3 pr-2 border-r border-gray-300">
                                    {watch("whatsappCode") || "+91"}
                                  </span>
                                </div>
                                <Input
                                  type="tel"
                                  className="block w-full rounded-md border-gray-300 pl-16 focus:border-primary-500 focus:ring-primary-500 text-sm md:text-base"
                                  placeholder="Enter WhatsApp number"
                                  {...field} // Bind field props
                                />
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Resume Upload Section */}
                  <div className="space-y-4">
                    <h2 className="text-lg md:text-xl font-semibold">Resume</h2>

                    <FormField
                      control={control}
                      name="resume"
                      render={({ field: { value, onChange, ...field } }) => (
                        <FormItem>
                          <FormLabel className="text-sm md:text-base">
                            Upload Resume
                          </FormLabel>
                          <FormControl>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                              <Input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    onChange(file);
                                  }
                                }}
                                {...field}
                                className="text-sm md:text-base"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                  document
                                    .getElementById("resume-upload")
                                    ?.click()
                                }
                                className="text-sm md:text-base"
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload file
                              </Button>
                            </div>
                          </FormControl>
                          <p className="text-xs md:text-sm text-gray-500 mt-1">
                            Acceptable formats: .doc, .docx, .pdf
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Message Section */}
                  <div className="space-y-4">
                    <h2 className="text-lg md:text-xl font-semibold">
                      Why should you be hired for this role?
                    </h2>

                    <FormField
                      control={control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="Write your message here"
                              className="min-h-[120px] md:min-h-[150px] text-sm md:text-base"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full text-sm md:text-base"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Application"}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
