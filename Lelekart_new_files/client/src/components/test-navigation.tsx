import { Button } from "./ui/button";

export default function TestNavigation() {
  const testProductIDs = [1, 2, 3, 4, 5];
  
  return (
    <div className="p-4 bg-white rounded-md shadow-sm">
      <h2 className="text-lg font-medium mb-4">Test Product Navigation</h2>
      <div className="flex flex-wrap gap-2">
        {testProductIDs.map((id) => (
          <Button
            key={id}
            variant="outline"
            onClick={() => {
              console.log(`Testing navigation to product ${id}`);
              try {
                // Use different navigation methods for testing
                if (id % 3 === 0) {
                  // Method 1: window.location.href
                  console.log(`Method 1: window.location.href for product ${id}`);
                  window.location.href = `/product-view/${id}`;
                } else if (id % 3 === 1) {
                  // Method 2: window.open
                  console.log(`Method 2: window.open for product ${id}`);
                  window.open(`/product-view/${id}`, '_self');
                } else {
                  // Method 3: location.assign
                  console.log(`Method 3: location.assign for product ${id}`);
                  window.location.assign(`/product-view/${id}`);
                }
              } catch (e) {
                console.error('Navigation error:', e);
              }
            }}
          >
            Product {id}
          </Button>
        ))}
      </div>
    </div>
  );
}