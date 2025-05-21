
import React, { useState, useEffect } from 'react';
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Save } from 'lucide-react';
import { supabase, isError } from "@/integrations/supabase/client";

// Define schema for the room form
const roomFormSchema = z.object({
  name: z.string().min(2, { message: "Room name must be at least 2 characters." }),
  buildingId: z.string().min(1, { message: "Building is required" }),
  floor: z.coerce.number().min(1, { message: "Floor is required" }),
  type: z.string().min(2, { message: "Room type must be at least 2 characters." }),
  isAvailable: z.boolean().default(true),
});

export type RoomFormValues = z.infer<typeof roomFormSchema>;

interface Building {
  id: string;
  name: string;
  floors: number;
}

interface RoomFormProps {
  defaultValues?: Partial<RoomFormValues>;
  defaultBuildingId?: string;
  onSubmit: (data: RoomFormValues) => void;
  onCancel: () => void;
}

const RoomForm: React.FC<RoomFormProps> = ({
  defaultValues,
  defaultBuildingId,
  onSubmit,
  onCancel
}) => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  
  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      buildingId: defaultValues?.buildingId || defaultBuildingId || '',
      floor: defaultValues?.floor || 1,
      type: defaultValues?.type || 'Classroom',
      isAvailable: defaultValues?.isAvailable ?? true
    }
  });
  
  // Get selected building's floors
  const selectedBuildingId = form.watch('buildingId');
  const selectedBuilding = buildings.find(b => b.id === selectedBuildingId);
  const floors = selectedBuilding 
    ? Array.from({ length: selectedBuilding.floors }, (_, i) => i + 1) 
    : [];
  
  // Fetch buildings on component mount
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('buildings')
          .select('id, name, floors');
        
        if (error) throw error;
        
        if (data && Array.isArray(data) && !isError(data)) {
          // Transform the Supabase data to match our Building interface
          const typedBuildings: Building[] = data.map(item => ({
            id: item.id?.toString() || '',
            name: item.name?.toString() || '',
            floors: typeof item.floors === 'number' ? item.floors : 1
          }));
          
          setBuildings(typedBuildings);
          
          // If there's a default building but it doesn't exist in our list, select the first building
          if (defaultValues?.buildingId && !typedBuildings.find(b => b.id === defaultValues.buildingId) && typedBuildings.length > 0) {
            form.setValue('buildingId', typedBuildings[0].id);
          }
          // If no default value but defaultBuildingId is provided, use that
          else if (defaultBuildingId && !typedBuildings.find(b => b.id === defaultBuildingId) && typedBuildings.length > 0) {
            form.setValue('buildingId', typedBuildings[0].id);
          }
          // If no default value and we have buildings, select the first one
          else if (!defaultValues?.buildingId && !defaultBuildingId && typedBuildings.length > 0) {
            form.setValue('buildingId', typedBuildings[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching buildings:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBuildings();
  }, [defaultBuildingId, defaultValues?.buildingId, form]);
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Room Name</FormLabel>
              <FormControl>
                <Input placeholder="Room 101" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="buildingId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Building</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                disabled={loading || buildings.length === 0}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a building" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {buildings.map(building => (
                    <SelectItem 
                      key={building.id} 
                      value={building.id}
                    >
                      {building.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {loading && (
                <FormDescription>Loading buildings...</FormDescription>
              )}
              {!loading && buildings.length === 0 && (
                <FormDescription>No buildings available. Please add a building first.</FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="floor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Floor</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(parseInt(value))} 
                defaultValue={field.value.toString()}
                disabled={!selectedBuildingId || floors.length === 0}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a floor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {floors.map(floor => (
                    <SelectItem 
                      key={floor.toString()} 
                      value={floor.toString()}
                    >
                      {floor === 1 ? "1st Floor" : 
                       floor === 2 ? "2nd Floor" : 
                       floor === 3 ? "3rd Floor" : 
                       `${floor}th Floor`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Room Type</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select room type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Classroom">Classroom</SelectItem>
                  <SelectItem value="Lab">Lab</SelectItem>
                  <SelectItem value="Lecture Hall">Lecture Hall</SelectItem>
                  <SelectItem value="Meeting Room">Meeting Room</SelectItem>
                  <SelectItem value="Computer Lab">Computer Lab</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="isAvailable"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Available</FormLabel>
                <FormDescription>
                  Mark this room as available for use
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
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
            Save Room
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default RoomForm;
