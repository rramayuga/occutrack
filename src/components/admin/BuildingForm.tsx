
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

export interface BuildingFormValues {
  name: string;
  floorCount: number;
  location?: string;
}

interface BuildingFormProps {
  defaultValues?: BuildingFormValues;
  onSubmit: (values: BuildingFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const formSchema = z.object({
  name: z.string().min(1, "Building name is required"),
  floorCount: z.coerce
    .number()
    .int()
    .positive("Must have at least one floor")
    .max(100, "Too many floors"),
  location: z.string().optional(),
});

const BuildingForm: React.FC<BuildingFormProps> = ({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      name: "",
      floorCount: 1,
      location: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
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
          name="floorCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Floors</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  {...field}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    field.onChange(isNaN(value) ? 1 : value);
                  }}
                />
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
                <Input placeholder="Campus North" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Building'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default BuildingForm;
