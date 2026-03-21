with open("/home/gurkirat/Projects/DELHI_28/frontend/app/page.tsx", "r") as f:
    text = f.read()

import_statement = 'import { TrackComplaint } from "@/components/TrackComplaint";\n'

# insert import
text = text.replace('import Link from "next/link";', 'import Link from "next/link";\n' + import_statement)

# insert the component
hook = """            </Link>
          </div>"""
hook_new = """            </Link>
          </div>
          <TrackComplaint />"""
text = text.replace(hook, hook_new, 1)

with open("/home/gurkirat/Projects/DELHI_28/frontend/app/page.tsx", "w") as f:
    f.write(text)
