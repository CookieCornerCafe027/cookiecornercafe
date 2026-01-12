# Flexible Sizing System

## Overview
The product system now supports **unlimited custom size options** using a JSONB array instead of fixed fields. Admins can add as many size variations as needed with completely custom labels.

## Key Features

### ✅ Unlimited Size Options
- Add 0, 1, 2, 3, or more size options per product
- No hard-coded limits

### ✅ Fully Custom Labels
- Size labels can be anything: "6 inches", "7 inches", "12 inches", "Small", "Family Size", "Party Pack", etc.
- Not limited to specific formats

### ✅ Backward Compatible
- Legacy products with `price_small`, `price_medium`, `price_large` still work
- System automatically migrates old format to new format
- Existing cart items continue to function

## Database Schema

### New Field
```sql
size_options jsonb DEFAULT '[]'::jsonb
```

### Format
```json
[
  {"label": "6 inches", "price": 28.00},
  {"label": "8 inches", "price": 38.00},
  {"label": "10 inches", "price": 48.00},
  {"label": "12 inches", "price": 65.00}
]
```

### Legacy Fields (Still Supported)
- `price_small`, `price_medium`, `price_large`
- `size_small_label`, `size_medium_label`, `size_large_label`

## Admin Interface

### Adding Products with Sizes

1. **No Sizes** (e.g., cookies):
   - Don't add any size options
   - Product will have a single price
   - Example: Cookie at $12.00

2. **Multiple Sizes**:
   - Click "Add Size" button to add size options
   - Each option has two fields:
     - Size label (e.g., "6 inches")
     - Price (e.g., 28.00)
   - Add as many as needed
   - Remove sizes with the minus (-) button

### Example Configurations

**Single-Size Product:**
```
No size options added
→ Customer sees: $15.00 (no size selector)
```

**Two Sizes:**
```
Size Option 1: "6 inches" | $28.00
Size Option 2: "8 inches" | $38.00
→ Customer must select between 6" or 8"
```

**Four Sizes:**
```
Size Option 1: "6 inches" | $28.00
Size Option 2: "8 inches" | $38.00
Size Option 3: "10 inches" | $48.00
Size Option 4: "12 inches" | $65.00
→ Customer chooses from 4 options
```

**Custom Labels:**
```
Size Option 1: "Individual" | $8.00
Size Option 2: "Family Pack" | $25.00
Size Option 3: "Party Size" | $50.00
→ Use any labels that make sense for your product
```

## Technical Details

### Cart Storage Format

#### New Format
```javascript
{
  id: "product-uuid",
  name: "Matcha Cake",
  price: 38.00,
  sizeIndex: 1,  // Index into product's size_options array
  sizeLabel: "8 inches",
  quantity: 2
}
```

#### Legacy Format (Still Works)
```javascript
{
  id: "product-uuid",
  name: "Matcha Cake",
  price: 38.00,
  size: "medium",  // or "6", "8", "10"
  sizeLabel: "8 inches",
  quantity: 2
}
```

### Component Behavior

**Product Detail Page:**
- Reads from `size_options` array if available
- Falls back to legacy fields if not
- Shows radio buttons for multiple sizes
- Shows plain text for single size
- Auto-selects first size

**Product Card:**
- Calculates price range from all available sizes
- Shows single price or min-max range

**Product Grid:**
- "Add to Cart" selects first available size automatically

**Cart:**
- Displays custom size labels
- Groups identical items (same product + same size)

**Stripe Checkout:**
- Uses custom size labels in product names
- Fetches labels from database if not in cart
- Calculates correct price based on size index

## Migration Guide

### Running the Migration

```bash
# Using Supabase CLI
supabase db push

# Or manually
psql your_database < supabase/migrations/013_add_flexible_size_options.sql
```

### Migration Behavior

The migration automatically:
1. Adds `size_options` JSONB column
2. Migrates existing products to new format
3. Keeps legacy fields for backward compatibility

**Example:**
```sql
-- Before
price_small: 28.00
size_small_label: "6 inches"
price_medium: 38.00
size_medium_label: "8 inches"

-- After (both exist)
price_small: 28.00  (still there)
size_small_label: "6 inches"  (still there)
price_medium: 38.00  (still there)
size_medium_label: "8 inches"  (still there)
size_options: [
  {"label": "6 inches", "price": 28.00},
  {"label": "8 inches", "price": 38.00}
]
```

### Updating Existing Products

1. Go to Admin Dashboard
2. Click "Edit" on a product
3. Size options will be pre-filled from legacy fields
4. Add, remove, or modify sizes as needed
5. Save - new format will be used going forward

## Examples

### Example 1: Cookie (No Sizes)
```json
{
  "name": "Chocolate Chip Cookies",
  "size_options": [],
  "price_small": 12.00  // Legacy field, shown as single price
}
```
- Display: "$12.00"
- No size selector shown

### Example 2: Cake (Multiple Sizes)
```json
{
  "name": "Matcha Cake",
  "size_options": [
    {"label": "6 inches", "price": 28.00},
    {"label": "8 inches", "price": 38.00},
    {"label": "10 inches", "price": 48.00}
  ]
}
```
- Display: "$28.00 - $48.00"
- Size selector with 3 options

### Example 3: Custom Sizes
```json
{
  "name": "Party Tray",
  "size_options": [
    {"label": "Small (serves 10)", "price": 35.00},
    {"label": "Medium (serves 20)", "price": 60.00},
    {"label": "Large (serves 30)", "price": 85.00},
    {"label": "XL (serves 50)", "price": 120.00}
  ]
}
```
- Display: "$35.00 - $120.00"
- Size selector with 4 options

## API Changes

### Product Data Structure
```typescript
interface SizeOption {
  label: string;
  price: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  // New flexible format
  size_options: SizeOption[] | null;
  // Legacy fields (still supported)
  price_small: number | null;
  price_medium: number | null;
  price_large: number | null;
  size_small_label: string | null;
  size_medium_label: string | null;
  size_large_label: string | null;
  // ... other fields
}
```

### Stripe Checkout API
Now accepts:
```typescript
{
  id: string;
  quantity: number;
  sizeIndex?: number | null;  // New: index into size_options
  size?: string | null;       // Legacy: "small", "medium", "large"
  sizeLabel?: string | null;
}
```

## Benefits

1. **Flexibility**: Add as many sizes as needed
2. **Custom Labels**: Use any naming convention
3. **No Code Changes**: Add new sizes without deploying
4. **Backward Compatible**: Existing data continues to work
5. **Future Proof**: Easy to extend with additional fields

## Testing Checklist

- [ ] Create product with no sizes
- [ ] Create product with 1 size
- [ ] Create product with 2 sizes
- [ ] Create product with 3+ sizes
- [ ] Add products to cart with different sizes
- [ ] Complete checkout with mixed cart
- [ ] Verify Stripe shows correct product names and prices
- [ ] Edit existing product and add/remove sizes
- [ ] Test legacy products still work correctly

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify the migration ran successfully
3. Ensure products have either `size_options` or legacy price fields populated
4. Clear browser localStorage if cart behaves unexpectedly

