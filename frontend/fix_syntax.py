with open("/home/gurkirat/Projects/DELHI_28/frontend/app/api/admin/analytics/root-cause/route.ts", "r") as f:
    text = f.read()

text = text.replace("""  if (!sectorId) {
    return NextResponse.json({ error: "sectorId is required" }, { status: 400 })
;
  }
    );
  }""", """  if (!sectorId) {
    return NextResponse.json({ error: "sectorId is required" }, { status: 400 });
  }""")

with open("/home/gurkirat/Projects/DELHI_28/frontend/app/api/admin/analytics/root-cause/route.ts", "w") as f:
    f.write(text)
