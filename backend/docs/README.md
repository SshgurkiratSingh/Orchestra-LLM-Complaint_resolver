# AI-Integrated Complaint Resolution System — RAG & Seed Data

## Folder Structure

```
backend/docs/
├── README.md
├── category_a_rag_knowledge_base/        ← Unstructured docs for FAISS/ChromaDB vectorization
│   ├── CHD_Municipal_Bylaws_and_Acts.docx    (34 pages — Bylaws, Building Rules, Zoning)
│   ├── CHD_PWD_PublicHealth_SOPs.docx         (19 pages — SOPs with SLA timelines)
│   └── CHD_Govt_Schemes_RTI_Guidelines.docx   (23 pages — Welfare schemes, RTI, citizen rights)
│
├── category_b_platform_master_data/      ← Structured JSON for MongoDB/Prisma seeding
│   ├── sector_demographics.json               (63 sectors/areas with population & zone data)
│   └── department_taxonomy.json               (17 departments, 53 roles, complaint categories)
│
└── category_c_historical_grievances/     ← CSV seed data for analytics dashboards
    └── historical_grievances_500.csv          (500 complaints over 12 months with seasonal patterns)
```

## Category A: RAG Knowledge Base (Chunk & Vectorize)

These DOCX files should be chunked (recommended: 500-token chunks with 100-token overlap) and
embedded into your FAISS or ChromaDB vector store for AWS Bedrock retrieval.

| Document | Pages | Use Case |
|----------|-------|----------|
| Municipal Bylaws & Acts | 34 | Policy Enforcer agent quotes section numbers for building/sanitation violations |
| PWD & Public Health SOPs | 19 | Orchestrator sets urgency scores and SLA timelines |
| Govt Schemes & RTI Guidelines | 23 | Citizen Chatbot informs citizens about scheme eligibility |

**All documents are MOCK/SIMULATED** — based on real frameworks but not actual legal text.

## Category B: Platform Master Data (MongoDB Seed)

Load these JSON files into your MongoDB collections via Prisma:

- **sector_demographics.json**: 63 entries — normalize complaint volumes against population for Civic Health Score
- **department_taxonomy.json**: 17 departments with 53 roles — route tickets to real departmentIds

## Category C: Historical Seed Grievances

- **500 complaints** spanning March 2025 – March 2026
- Status: 55% Resolved, 15% Rejected, 15% Pending, 10% In Progress, 5% Escalated
- Seasonal patterns: water complaints peak in summer, potholes during monsoon, stray animals in winter
- Use for Phase 4 Civic Health Score dashboards, heatmaps, and Root Cause Analyzer testing

## Quick Start

```python
# Vectorize Category A docs
from langchain.document_loaders import Docx2txtLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import FAISS

loader = Docx2txtLoader("category_a_rag_knowledge_base/CHD_Municipal_Bylaws_and_Acts.docx")
docs = loader.load()
splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
chunks = splitter.split_documents(docs)
# ... embed with Bedrock/OpenAI and store in FAISS

# Seed MongoDB with Category B
import json
with open("category_b_platform_master_data/sector_demographics.json") as f:
    sectors = json.load(f)
# Insert into MongoDB via Prisma or pymongo

# Load Category C for analytics
import pandas as pd
df = pd.read_csv("category_c_historical_grievances/historical_grievances_500.csv")
```
