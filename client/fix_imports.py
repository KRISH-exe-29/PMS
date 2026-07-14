import os
import glob
import re

ui_files = glob.glob('src/components/ui/*.tsx')
for f in ui_files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    content = re.sub(r"import\s+\{\s*ReactNode\s*\}\s+from\s+['\"]react['\"];", "import type { ReactNode } from 'react';", content)
    content = re.sub(r"import\s+\{\s*LucideIcon\s*\}\s+from\s+['\"]lucide-react['\"];", "import type { LucideIcon } from 'lucide-react';", content)
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)

page_files = glob.glob('src/pages/*.tsx')
for f in page_files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    content = re.sub(r"import\s+DataTable,\s*\{\s*Column\s*\}\s+from\s+['\"]\.\./components/ui/DataTable['\"];", "import DataTable from '../components/ui/DataTable';\nimport type { Column } from '../components/ui/DataTable';", content)
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)

theme_file = 'src/lib/theme.tsx'
if os.path.exists(theme_file):
    with open(theme_file, 'r', encoding='utf-8') as file:
        content = file.read()
    content = re.sub(r"import\s+\{\s*(.*?)\s*ReactNode\s*(.*?)\}\s+from\s+['\"]react['\"];", r"import {\1 \2} from 'react';\nimport type { ReactNode } from 'react';", content)
    content = re.sub(r"import\s+\{\s*\}\s+from\s+['\"]react['\"];\n", "", content)
    with open(theme_file, 'w', encoding='utf-8') as file:
        file.write(content)
print("Fixes applied successfully.")
