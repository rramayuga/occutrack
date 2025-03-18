
import React from 'react';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save } from 'lucide-react';

// Define schema for the building form
const buildingFormSchema = z.object({
  name: z.string().min(2, { message: "Building name must be at least 2 characters." }),
  floorCount: z.coerce.number().min(1, { message: "Building must have at least 1 floor" }).max(20, { message: "Building can have at most 20 floors" }),
  location: z.string().optional(),
});

export type BuildingFormValues = z.infer<typeof buildingFormSchema>;

interface BuildingFormProps {
  defaultValues?: BuildingFormValues;
  onSubmit: (data: BuildingFormValues) => void;
  onCancel: () => void;
}

const BuildingForm: React.FC<BuildingFormProps> = ({
  defaultValues,
  onSubmit,
  onCancel
}) => {
  const form = useForm<BuildingFormValues>({
    resolver: zodResolver(buildingFormSchema),
    defaultValues: defaultValues || {
      name: '',
      floorCount: 1,
      location: ''
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Building Name</FormLabel>
              <FormControl>
                <Input placeholder="Main Building" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="North Campus" {...field} />
              </FormControl>
              <FormDescription>
                Specify the location of this building on campus
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="floorCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Floors</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="1" 
                  max="20"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Enter the number of floors in this building (max 20)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-2 pt-2">
          <Button 
            variant="outline" 
            type="button" 
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit">
            <Save className="mr-2 h-4 w-4" />
            Save Building
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default BuildingForm;
