import { useState, useRef, useEffect } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useCategories } from "@/hooks/use-categories";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Pencil,
  Trash2,
  Image as ImageIcon,
  Link,
  Copy,
  Save,
  Plus,
  Layers,
  LayoutGrid,
  GripVertical,
  Palette,
  Type,
  Monitor,
  Smartphone,
  Eye,
  Loader2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useGallery } from "@/hooks/use-gallery";
import { type Category } from "@/hooks/use-categories";

// Types for drag and drop elements
interface DraggableElement {
  id: string;
  type:
    | "banner"
    | "category"
    | "product"
    | "text"
    | "button"
    | "spacer"
    | "custom";
  content: any;
}

// Component for sortable elements
function SortableItem({
  element,
  onEdit,
  onRemove,
}: {
  element: DraggableElement;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-md border bg-card text-card-foreground shadow-sm mb-3 cursor-move"
    >
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <div {...attributes} {...listeners} className="cursor-grab p-1">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <div className="font-medium">
              {element.type.charAt(0).toUpperCase() + element.type.slice(1)}
            </div>
            <div className="text-sm text-muted-foreground">
              {element.type === "banner" && element.content.title}
              {element.type === "category" && element.content.name}
              {element.type === "product" && element.content.name}
              {element.type === "text" && "Text block"}
              {element.type === "button" && element.content.text}
              {element.type === "spacer" &&
                `${element.content.height}px height`}
              {element.type === "custom" && "Custom HTML"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(element.id)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit element</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(element.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Remove element</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}

// Component to render a preview of a banner
function BannerPreview({
  banner,
}: {
  banner: {
    id: number;
    title: string;
    subtitle?: string;
    imageUrl: string;
    badgeText?: string;
    buttonText?: string;
  };
}) {
  return (
    <div className="relative w-full h-32 overflow-hidden rounded-md mb-2">
      <img
        src={banner.imageUrl}
        alt={banner.title}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.src =
            "https://placehold.co/600x400/gray/white?text=Banner+Preview";
        }}
      />
      <div className="absolute inset-0 bg-black/30 flex flex-col items-start justify-center p-4 text-white">
        {banner.badgeText && (
          <span className="bg-primary text-primary-foreground px-2 py-0.5 text-xs font-medium rounded mb-2">
            {banner.badgeText}
          </span>
        )}
        <h3 className="text-lg font-bold">{banner.title}</h3>
        <p className="text-sm opacity-90">{banner.subtitle}</p>
        <button className="mt-2 bg-white text-black px-3 py-1 text-xs rounded-sm hover:bg-gray-100 transition-colors">
          {banner.buttonText || "Shop Now"}
        </button>
      </div>
    </div>
  );
}

// Main component
export default function DesignHero() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch banners
  const { data: banners = [] } = useQuery({
    queryKey: ["/api/banners"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/banners");
      return await res.json();
    },
  });

  // Fetch categories
  const { data: categories = [] } = useCategories();

  // State for handling the drag and drop elements
  const [elements, setElements] = useState<DraggableElement[]>([]);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState("design");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop"
  );
  const [saving, setSaving] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [customHtml, setCustomHtml] = useState("");

  // Add elements to the canvas
  const addElement = (type: DraggableElement["type"], content: any = {}) => {
    const newElement: DraggableElement = {
      id: `${type}-${Date.now()}`,
      type,
      content,
    };

    setElements([...elements, newElement]);
  };

  // Edit an element
  const editElement = (id: string) => {
    setEditingElementId(id);
  };

  // Remove an element
  const removeElement = (id: string) => {
    setElements(elements.filter((el) => el.id !== id));
  };

  // Drag end handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setElements((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Save the hero design
  const saveHeroDesign = async () => {
    setSaving(true);

    try {
      // This would typically be implemented to save the hero design to the database
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Mock API delay

      toast({
        title: "Hero design saved",
        description: "Your hero design has been saved successfully.",
      });

      // In a real implementation, you would update any relevant query data
      // queryClient.invalidateQueries({ queryKey: ["/api/hero-design"] });
    } catch (error) {
      toast({
        title: "Error saving hero design",
        description: "There was an error saving your hero design.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
            Hero Page Designer
          </h1>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 sm:h-9 sm:w-9"
                    onClick={() =>
                      setPreviewMode((prev) =>
                        prev === "desktop" ? "mobile" : "desktop"
                      )
                    }
                  >
                    {previewMode === "desktop" ? (
                      <Monitor className="h-4 w-4" />
                    ) : (
                      <Smartphone className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Toggle {previewMode === "desktop" ? "Mobile" : "Desktop"}{" "}
                    Preview
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 sm:h-9 sm:w-9"
                    onClick={() => setShowCodeEditor(!showCodeEditor)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <polyline points="16 18 22 12 16 6"></polyline>
                      <polyline points="8 6 2 12 8 18"></polyline>
                    </svg>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle Code Editor</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              onClick={saveHeroDesign}
              disabled={saving}
              className="hidden sm:flex flex-1 sm:flex-none"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Design
            </Button>

            <Button
              onClick={saveHeroDesign}
              disabled={saving}
              size="icon"
              className="sm:hidden h-8 w-8 sm:h-9 sm:w-9"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="mb-4 sm:mb-6">
          <Tabs
            defaultValue="design"
            value={currentTab}
            onValueChange={setCurrentTab}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="design" className="text-xs sm:text-sm">
                Design
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-xs sm:text-sm">
                Preview
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs sm:text-sm">
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="design" className="pt-4 sm:pt-6">
              <div className="block lg:hidden">
                {/* Mobile Layout */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base sm:text-lg">
                        Add Elements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                        <Button
                          variant="outline"
                          className="h-auto flex-col py-2 sm:py-3 justify-start items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                          onClick={() => {
                            if (banners.length > 0) {
                              addElement("banner", banners[0]);
                            } else {
                              toast({
                                title: "No banners available",
                                description: "Please create a banner first.",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span className="text-xs">Banner</span>
                        </Button>

                        <Button
                          variant="outline"
                          className="h-auto flex-col py-2 sm:py-3 justify-start items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                          onClick={() => {
                            if (categories.length > 0) {
                              addElement("category", categories[0]);
                            } else {
                              toast({
                                title: "No categories available",
                                description: "Please create a category first.",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          <LayoutGrid className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span className="text-xs">Category</span>
                        </Button>

                        <Button
                          variant="outline"
                          className="h-auto flex-col py-2 sm:py-3 justify-start items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                          onClick={() =>
                            addElement("text", {
                              text: "Enter your text here",
                              size: 16,
                              color: "#000000",
                              align: "left",
                              fontWeight: "normal",
                            })
                          }
                        >
                          <Type className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span className="text-xs">Text</span>
                        </Button>

                        <Button
                          variant="outline"
                          className="h-auto flex-col py-2 sm:py-3 justify-start items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                          onClick={() =>
                            addElement("button", {
                              text: "Click Me",
                              url: "#",
                              backgroundColor: "#2874f0",
                              textColor: "#ffffff",
                              borderRadius: 4,
                            })
                          }
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4 sm:h-5 sm:w-5"
                          >
                            <rect
                              x="3"
                              y="8"
                              width="18"
                              height="8"
                              rx="2"
                              ry="2"
                            ></rect>
                            <line x1="12" y1="8" x2="12" y2="16"></line>
                          </svg>
                          <span className="text-xs">Button</span>
                        </Button>

                        <Button
                          variant="outline"
                          className="h-auto flex-col py-2 sm:py-3 justify-start items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                          onClick={() => addElement("spacer", { height: 20 })}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4 sm:h-5 sm:w-5"
                          >
                            <path d="M21 6H3"></path>
                            <path d="M21 18H3"></path>
                          </svg>
                          <span className="text-xs">Spacer</span>
                        </Button>

                        <Button
                          variant="outline"
                          className="h-auto flex-col py-2 sm:py-3 justify-start items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                          onClick={() =>
                            addElement("custom", {
                              html: "<div>Custom HTML content</div>",
                            })
                          }
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4 sm:h-5 sm:w-5"
                          >
                            <polyline points="16 18 22 12 16 6"></polyline>
                            <polyline points="8 6 2 12 8 18"></polyline>
                          </svg>
                          <span className="text-xs">Custom</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base sm:text-lg">
                        Design Canvas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={elements.map((el) => el.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {elements.length > 0 ? (
                            elements.map((element) => (
                              <SortableItem
                                key={element.id}
                                element={element}
                                onEdit={editElement}
                                onRemove={removeElement}
                              />
                            ))
                          ) : (
                            <div className="h-24 sm:h-32 flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                              <div className="mb-2 rounded-full bg-muted p-2">
                                <Layers className="h-4 w-4" />
                              </div>
                              <h3 className="text-sm font-medium">
                                No Elements Added
                              </h3>
                              <p className="text-xs mt-1">
                                Add elements to start designing your hero
                                section.
                              </p>
                            </div>
                          )}
                        </SortableContext>
                      </DndContext>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="hidden lg:block">
                {/* Desktop Layout */}
                <ResizablePanelGroup direction="horizontal">
                  <ResizablePanel defaultSize={25} minSize={20}>
                    <div className="h-[calc(100vh-240px)] overflow-y-auto pr-4">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-medium mb-3">
                            Add Elements
                          </h3>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              className="h-auto flex-col py-3 justify-start items-center gap-2"
                              onClick={() => {
                                if (banners.length > 0) {
                                  addElement("banner", banners[0]);
                                } else {
                                  toast({
                                    title: "No banners available",
                                    description:
                                      "Please create a banner first.",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              <ImageIcon className="h-5 w-5" />
                              <span>Banner</span>
                            </Button>

                            <Button
                              variant="outline"
                              className="h-auto flex-col py-3 justify-start items-center gap-2"
                              onClick={() => {
                                if (categories.length > 0) {
                                  addElement("category", categories[0]);
                                } else {
                                  toast({
                                    title: "No categories available",
                                    description:
                                      "Please create a category first.",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              <LayoutGrid className="h-5 w-5" />
                              <span>Category</span>
                            </Button>

                            <Button
                              variant="outline"
                              className="h-auto flex-col py-3 justify-start items-center gap-2"
                              onClick={() =>
                                addElement("text", {
                                  text: "Enter your text here",
                                  size: 16,
                                  color: "#000000",
                                  align: "left",
                                  fontWeight: "normal",
                                })
                              }
                            >
                              <Type className="h-5 w-5" />
                              <span>Text</span>
                            </Button>

                            <Button
                              variant="outline"
                              className="h-auto flex-col py-3 justify-start items-center gap-2"
                              onClick={() =>
                                addElement("button", {
                                  text: "Click Me",
                                  url: "#",
                                  backgroundColor: "#2874f0",
                                  textColor: "#ffffff",
                                  borderRadius: 4,
                                })
                              }
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-5 w-5"
                              >
                                <rect
                                  x="3"
                                  y="8"
                                  width="18"
                                  height="8"
                                  rx="2"
                                  ry="2"
                                ></rect>
                                <line x1="12" y1="8" x2="12" y2="16"></line>
                              </svg>
                              <span>Button</span>
                            </Button>

                            <Button
                              variant="outline"
                              className="h-auto flex-col py-3 justify-start items-center gap-2"
                              onClick={() =>
                                addElement("spacer", { height: 20 })
                              }
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-5 w-5"
                              >
                                <path d="M21 6H3"></path>
                                <path d="M21 18H3"></path>
                              </svg>
                              <span>Spacer</span>
                            </Button>

                            <Button
                              variant="outline"
                              className="h-auto flex-col py-3 justify-start items-center gap-2"
                              onClick={() =>
                                addElement("custom", {
                                  html: "<div>Custom HTML content</div>",
                                })
                              }
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-5 w-5"
                              >
                                <polyline points="16 18 22 12 16 6"></polyline>
                                <polyline points="8 6 2 12 8 18"></polyline>
                              </svg>
                              <span>Custom</span>
                            </Button>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-medium mb-3">
                            Available Banners
                          </h3>
                          <div className="space-y-2">
                            {banners.length > 0 ? (
                              banners.map(
                                (banner: {
                                  id: number;
                                  title: string;
                                  subtitle?: string;
                                  imageUrl: string;
                                  badgeText?: string;
                                  buttonText?: string;
                                }) => (
                                  <div
                                    key={banner.id}
                                    className="border rounded-md p-2 cursor-pointer hover:bg-gray-50"
                                    onClick={() => addElement("banner", banner)}
                                  >
                                    <BannerPreview banner={banner} />
                                    <div className="text-sm font-medium truncate">
                                      {banner.title}
                                    </div>
                                  </div>
                                )
                              )
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                No banners available. Create banners in Banner
                                Management.
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-medium mb-3">
                            Available Categories
                          </h3>
                          <div className="grid grid-cols-2 gap-2">
                            {categories.length > 0 ? (
                              categories.map((category) => (
                                <div
                                  key={category.id}
                                  className="border rounded-md p-2 cursor-pointer hover:bg-gray-50"
                                  onClick={() =>
                                    addElement("category", category)
                                  }
                                >
                                  <div className="w-full h-14 bg-gray-100 rounded-md mb-2 overflow-hidden">
                                    <img
                                      src={category.image}
                                      alt={category.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.src =
                                          "https://placehold.co/200x200/gray/white?text=Category";
                                      }}
                                    />
                                  </div>
                                  <div className="text-sm font-medium truncate">
                                    {category.name}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-sm text-muted-foreground col-span-2">
                                No categories available. Create categories in
                                Categories Management.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </ResizablePanel>

                  <ResizableHandle />

                  <ResizablePanel defaultSize={75}>
                    <Card className="h-[calc(100vh-240px)] overflow-hidden">
                      <CardHeader className="p-4 border-b">
                        <div className="flex justify-between items-center">
                          <CardTitle>Hero Design Canvas</CardTitle>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setElements([])}
                            >
                              Clear All
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      {showCodeEditor ? (
                        <CardContent className="p-0 h-[calc(100%-56px)]">
                          <div className="h-full flex flex-col">
                            <div className="bg-slate-800 text-slate-200 p-2 text-xs">
                              HTML Editor (Advanced)
                            </div>
                            <Textarea
                              className="flex-1 font-mono p-4 text-sm rounded-none outline-none focus-visible:ring-0"
                              value={customHtml}
                              onChange={(e) => setCustomHtml(e.target.value)}
                              placeholder="Enter custom HTML for your hero section here..."
                            />
                            <div className="bg-slate-100 p-2 border-t flex justify-end">
                              <Button
                                size="sm"
                                onClick={() => setShowCodeEditor(false)}
                              >
                                Apply HTML
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      ) : (
                        <CardContent className="p-0 h-[calc(100%-56px)]">
                          <div className="flex h-full">
                            <div className="w-1/2 border-r h-full overflow-y-auto p-4">
                              <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                              >
                                <SortableContext
                                  items={elements.map((el) => el.id)}
                                  strategy={verticalListSortingStrategy}
                                >
                                  {elements.length > 0 ? (
                                    elements.map((element) => (
                                      <SortableItem
                                        key={element.id}
                                        element={element}
                                        onEdit={editElement}
                                        onRemove={removeElement}
                                      />
                                    ))
                                  ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                                      <div className="mb-4 rounded-full bg-muted p-3">
                                        <Layers className="h-6 w-6" />
                                      </div>
                                      <h3 className="text-lg font-medium">
                                        No Elements Added
                                      </h3>
                                      <p className="max-w-md mt-2">
                                        Add elements from the left panel to
                                        start designing your hero section. You
                                        can add banners, categories, text,
                                        buttons, and more.
                                      </p>
                                    </div>
                                  )}
                                </SortableContext>
                              </DndContext>
                            </div>
                            <div
                              className={cn("h-full overflow-y-auto p-4", {
                                "w-1/2": previewMode === "desktop",
                                "w-80 mx-auto": previewMode === "mobile",
                              })}
                            >
                              <div
                                className={cn("border rounded-md", {
                                  "p-4": previewMode === "desktop",
                                  "p-2": previewMode === "mobile",
                                })}
                              >
                                <div className="text-sm text-muted-foreground mb-4">
                                  {previewMode === "desktop"
                                    ? "Desktop Preview"
                                    : "Mobile Preview"}
                                </div>

                                {elements.length > 0 ? (
                                  <div className="space-y-4">
                                    {elements.map((element) => (
                                      <div
                                        key={element.id}
                                        className="border rounded p-3"
                                      >
                                        <div className="text-xs text-muted-foreground mb-2">
                                          {element.type
                                            .charAt(0)
                                            .toUpperCase() +
                                            element.type.slice(1)}
                                        </div>
                                        {element.type === "banner" && (
                                          <BannerPreview
                                            banner={element.content}
                                          />
                                        )}
                                        {element.type === "category" && (
                                          <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                                              <img
                                                src={element.content.image}
                                                alt={element.content.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                  e.currentTarget.src =
                                                    "https://placehold.co/200x200/gray/white?text=Category";
                                                }}
                                              />
                                            </div>
                                            <div>
                                              <div className="font-medium">
                                                {element.content.name}
                                              </div>
                                              <div className="text-sm text-muted-foreground">
                                                {element.content.description}
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                        {element.type === "text" && (
                                          <div
                                            style={{
                                              fontSize:
                                                element.content.size + "px",
                                              color: element.content.color,
                                              textAlign: element.content.align,
                                              fontWeight:
                                                element.content.fontWeight,
                                            }}
                                          >
                                            {element.content.text}
                                          </div>
                                        )}
                                        {element.type === "button" && (
                                          <button
                                            className="px-4 py-2 rounded text-sm"
                                            style={{
                                              backgroundColor:
                                                element.content.backgroundColor,
                                              color: element.content.textColor,
                                              borderRadius:
                                                element.content.borderRadius +
                                                "px",
                                            }}
                                          >
                                            {element.content.text}
                                          </button>
                                        )}
                                        {element.type === "spacer" && (
                                          <div
                                            className="bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-xs text-muted-foreground"
                                            style={{
                                              height:
                                                element.content.height + "px",
                                            }}
                                          >
                                            Spacer ({element.content.height}px)
                                          </div>
                                        )}
                                        {element.type === "custom" && (
                                          <div
                                            className="bg-gray-50 border rounded p-2 text-xs"
                                            dangerouslySetInnerHTML={{
                                              __html: element.content.html,
                                            }}
                                          />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center text-muted-foreground py-8">
                                    <div className="mb-2 rounded-full bg-muted p-2 w-fit mx-auto">
                                      <Eye className="h-4 w-4" />
                                    </div>
                                    <p>No elements to preview</p>
                                    <p className="text-xs">
                                      Add elements to see them here
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="pt-6">
              <div
                className={cn("mx-auto border rounded-lg overflow-hidden", {
                  "max-w-4xl": previewMode === "desktop",
                  "max-w-sm": previewMode === "mobile",
                })}
              >
                <div className="bg-gray-100 text-sm p-2 text-center text-muted-foreground border-b">
                  {previewMode === "desktop" ? "Desktop" : "Mobile"} Preview
                </div>

                <div className="p-4">
                  {elements.length > 0 ? (
                    <div className="space-y-4">
                      {elements.map((element) => (
                        <div key={element.id} className="border rounded p-3">
                          <div className="text-xs text-muted-foreground mb-2">
                            {element.type.charAt(0).toUpperCase() +
                              element.type.slice(1)}
                          </div>
                          {element.type === "banner" && (
                            <BannerPreview banner={element.content} />
                          )}
                          {element.type === "category" && (
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                                <img
                                  src={element.content.image}
                                  alt={element.content.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src =
                                      "https://placehold.co/200x200/gray/white?text=Category";
                                  }}
                                />
                              </div>
                              <div>
                                <div className="font-medium">
                                  {element.content.name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {element.content.description}
                                </div>
                              </div>
                            </div>
                          )}
                          {element.type === "text" && (
                            <div
                              style={{
                                fontSize: element.content.size + "px",
                                color: element.content.color,
                                textAlign: element.content.align,
                                fontWeight: element.content.fontWeight,
                              }}
                            >
                              {element.content.text}
                            </div>
                          )}
                          {element.type === "button" && (
                            <button
                              className="px-4 py-2 rounded text-sm"
                              style={{
                                backgroundColor:
                                  element.content.backgroundColor,
                                color: element.content.textColor,
                                borderRadius:
                                  element.content.borderRadius + "px",
                              }}
                            >
                              {element.content.text}
                            </button>
                          )}
                          {element.type === "spacer" && (
                            <div
                              className="bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-xs text-muted-foreground"
                              style={{ height: element.content.height + "px" }}
                            >
                              Spacer ({element.content.height}px)
                            </div>
                          )}
                          {element.type === "custom" && (
                            <div
                              className="bg-gray-50 border rounded p-2 text-xs"
                              dangerouslySetInnerHTML={{
                                __html: element.content.html,
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <div className="mb-2 rounded-full bg-muted p-2 w-fit mx-auto">
                        <Eye className="h-4 w-4" />
                      </div>
                      <p>No elements to preview</p>
                      <p className="text-xs">Add elements to see them here</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>
                      Configure basic hero section settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="heroTitle">Hero Section Title</Label>
                      <Input
                        id="heroTitle"
                        placeholder="Enter hero section title"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="heroDescription">Description</Label>
                      <Textarea
                        id="heroDescription"
                        placeholder="Enter hero section description"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxElements">Maximum Elements</Label>
                      <Select defaultValue="10">
                        <SelectTrigger id="maxElements">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 Elements</SelectItem>
                          <SelectItem value="10">10 Elements</SelectItem>
                          <SelectItem value="15">15 Elements</SelectItem>
                          <SelectItem value="20">20 Elements</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch id="autoSave" defaultChecked />
                      <Label htmlFor="autoSave">Auto-save changes</Label>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Responsive Settings</CardTitle>
                    <CardDescription>
                      Configure how the hero section appears on different
                      devices
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="mobileElements">
                          Show Elements on Mobile
                        </Label>
                        <span className="text-xs text-muted-foreground">
                          All
                        </span>
                      </div>
                      <Select defaultValue="all">
                        <SelectTrigger id="mobileElements">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Elements</SelectItem>
                          <SelectItem value="essential">
                            Essential Only
                          </SelectItem>
                          <SelectItem value="custom">
                            Custom Selection
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Mobile Banner Height</Label>
                        <span className="text-xs text-muted-foreground">
                          200px
                        </span>
                      </div>
                      <Slider defaultValue={[200]} max={500} step={10} />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch id="lazyLoad" defaultChecked />
                      <Label htmlFor="lazyLoad">Lazy Load Images</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch id="mobileOptimization" defaultChecked />
                      <Label htmlFor="mobileOptimization">
                        Mobile Optimization
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Advanced Settings</CardTitle>
                    <CardDescription>
                      Advanced configuration options for the hero section
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="animationSpeed">Animation Speed</Label>
                        <Select defaultValue="normal">
                          <SelectTrigger id="animationSpeed">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="slow">Slow</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="fast">Fast</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="transitionType">Transition Type</Label>
                        <Select defaultValue="fade">
                          <SelectTrigger id="transitionType">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fade">Fade</SelectItem>
                            <SelectItem value="slide">Slide</SelectItem>
                            <SelectItem value="zoom">Zoom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customCSS">Custom CSS</Label>
                      <Textarea
                        id="customCSS"
                        placeholder="Enter custom CSS for the hero section"
                        rows={4}
                        className="font-mono text-sm"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch id="debugMode" />
                      <Label htmlFor="debugMode">Debug Mode</Label>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  );
}
