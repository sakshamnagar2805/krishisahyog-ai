# KrishiSahyog AI — Phase 13 5-minute hackathon walkthrough

**Do not claim integrations with UIDAI, PMFBY insurers, PACS, CPGRAMS or government approval.** All farmer accounts, claimed amounts, documents, grievance tickets and cooperative stock shown in demo mode are invented; official external links and researched scheme references are different data sources.

### 0:00–0:35: Problem
Say: "Farmers often need to navigate multiple portals for crop insurance, agricultural credit and government schemes. KrishiSahyog demonstrates how one interface could guide these journeys, while protecting the difference between public information and private records."

### 0:35–1:05: Farmer dashboard
On localhost demo mode, open **Dashboard**. Point out the prominent **HACKATHON DEMO** warning and the synthetic farmer's crop and landholding. Explicitly say the claim and PACS values are simulated.

### 1:05–1:50: Crop insurance → documents
Open **Crop insurance (PMFBY)**, review the original demo claim and document requirements, then open **Documents** and record a local land-document preparation note. Highlight that the document remains missing until verified by the real authority; no file was uploaded.

### 1:50–2:35: Grievance journey
Open **Grievances** from a claim, create a local complaint linked to the same claim ID, then click **Simulate: under review** and show the local timeline. Say: "This simulates a workflow; it has not filed a complaint with CPGRAMS."

### 2:35–3:15: PACS journey
Open **PACS services**, save a simulated KCC enquiry and show its browser-local request ID; simulate **information required** and **guidance provided**. Open Notifications to show activity recorded across modules. Refresh and show persistence.

### 3:15–4:15: Real public information and verified AI
Open **Government schemes**, search crop insurance / solar pumps / KCC among the **12 reviewed research candidates**. Point out the explicit **RESEARCH ONLY — NOT APPROVED** marking and official government URLs. This is research matching, **not a live Gemini answer or eligibility determination**. Open **AI assistant** to demonstrate that it does not hallucinate sourced answers when no approved published records exist. If genuine reviewed records and a Gemini key are configured, a live response can be shown after checking citations.

### 4:15–5:00: Architecture, impact and future work
Explain that public research is staged separately from permissioned document ingestion and a two-person publication review. Explain outstanding items honestly: government reuse permission, current state-specific policies, real farmer authentication, PMFBY/PACS/CPGRAMS integrations, controlled infrastructure and production testing.

## Common judge questions

**Is this official claim data?** No; the farmer module is a clearly labeled simulation. Real public scheme links and staging records are shown separately.

**Can I submit a real grievance?** No, the demo records a complaint only in browser storage. Use the official grievance portal.

**Do you know if the farmer is eligible?** No, relevance is not a government eligibility determination.

**Is the AI live?** The approved-source assistant is implemented, but a live answer depends on a truly approved published record, backend and Gemini API connectivity.

**Can it be deployed to farmers today?** Not as a government-integrated service. The current project is a controlled hackathon prototype.
