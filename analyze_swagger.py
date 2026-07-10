import json
import sys

def analyze_swagger():
    try:
        with open('/Users/computer-care/.gemini/antigravity/brain/8da3f8b5-f91f-474e-a4c0-8bb55d84a271/.system_generated/steps/608/content.md', 'r') as f:
            text = f.read()
            # find json payload
            start = text.find('{')
            if start != -1:
                data = json.loads(text[start:])
            else:
                print("No JSON found")
                return

        schemas = data.get('components', {}).get('schemas', {})
        
        # Product
        product_schemas = {k: v for k, v in schemas.items() if 'Product' in k}
        if product_schemas:
            prod_key = 'Product' if 'Product' in product_schemas else list(product_schemas.keys())[0]
            print('=== PRODUCT SCHEMA ===')
            props = schemas[prod_key].get('properties', {})
            for p_name, p_val in props.items():
                print(f'- {p_name}: {p_val.get("type", p_val.get("$ref", ""))}')
        else:
            print('Product schema not found')

        # Inventory
        inventory_schemas = {k: v for k, v in schemas.items() if 'Inventory' in k or 'Stock' in k}
        print('\n=== INVENTORY/STOCK SCHEMAS ===')
        for k in inventory_schemas.keys():
            print('-', k)
            
        # Inventory endpoints
        paths = data.get('paths', {})
        print('\n=== INVENTORY ENDPOINTS ===')
        for p in paths.keys():
            if 'inventory' in p.lower() or 'stock' in p.lower():
                print('-', p)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    analyze_swagger()
