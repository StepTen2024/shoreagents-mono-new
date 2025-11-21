# 🎯 RAG Document Visibility Test Plan

## 📄 Test Documents Created

### 1. **Admin Document: Fun Friday Policy**
- **File:** `TEST-ADMIN-FUN-FRIDAY-POLICY.md`
- **Type:** Company Policy (ADMIN)
- **Content:** Hilarious, over-the-top casual dress code policy
- **Key Phrases to Test:**
  - "Hawaiian shirt"
  - "Fun Friday"
  - "Crocs are allowed" (lol)
  - "dinosaur onesie"
  - "P.P.P.S." (the triple postscript)

### 2. **Client Document: VAULTRE Real Estate Guide**
- **File:** `TEST-CLIENT-VAULTRE-LISTING-GUIDE.md`
- **Type:** Client SOP (CLIENT)
- **Company:** Prestige Property Group Australia
- **Content:** Comprehensive real estate CRM listing guide
- **Key Phrases to Test:**
  - "VAULTRE"
  - "property listing"
  - "Domain.com.au"
  - "vendor authority"
  - "hero shot"

---

## 🧪 Testing Procedure

### **Step 1: Upload Admin Document**

1. **Login as MANAGEMENT user:**
   - URL: `http://localhost:3000/admin/documents`
   - Use your management credentials

2. **Upload Document:**
   - Click "Upload Document" or similar
   - Upload: `TEST-ADMIN-FUN-FRIDAY-POLICY.md`
   - Title: "Fun Friday Dress Code Policy"
   - Category: "POLICY" or "COMPANY_POLICY"
   - **Visibility: Share with ALL staff** (`sharedWithAll: true`)
   - Submit

3. **Wait for Processing:**
   - Watch terminal for: `🤖 [RAG] Queueing document...`
   - Should see: `📄 [DOCUMENT-PROCESSOR] Created XX text chunks`
   - Processing takes 30-60 seconds

---

### **Step 2: Upload Client Document**

1. **Login as CLIENT user:**
   - URL: `http://localhost:3000/client/documents`
   - Use a real client login (e.g., from Prestige Property Group)

2. **Upload Document:**
   - Click "Upload Document"
   - Upload: `TEST-CLIENT-VAULTRE-LISTING-GUIDE.md`
   - Title: "VAULTRE Listing Processing Guide"
   - Category: "PROCEDURES" or "TRAINING"
   - **Visibility: Share with assigned staff** or **All company staff**
   - Submit

3. **Wait for Processing:**
   - Watch terminal for RAG logs
   - Should process 40-50 chunks (it's a long doc)

---

### **Step 3: Test RAG with Staff from SAME Company**

1. **Login as STAFF user** (assigned to Prestige Property Group)
   - URL: `http://localhost:3000/ai-assistant`

2. **Test Query 1 (Admin Doc - Should Work):**
   ```
   What can I wear on Fun Friday?
   ```
   
   **Expected Response:**
   - Should cite "Fun Friday Policy"
   - Should mention Hawaiian shirts, hoodies, Crocs, etc.
   - Should have the funny tone from the doc
   - Might reference "dinosaur onesie" or other absurd examples

3. **Test Query 2 (Client Doc - Should Work):**
   ```
   How do I upload photos in VAULTRE for a property listing?
   ```
   
   **Expected Response:**
   - Should cite "VAULTRE Listing Processing Guide"
   - Should mention "hero shot must be first"
   - Should reference minimum 8 photos, 1920x1080px resolution
   - Should mention photo order and drag-to-arrange

4. **Test Query 3 (Cross-Document):**
   ```
   Can I wear my Hawaiian shirt while processing VAULTRE listings?
   ```
   
   **Expected Response:**
   - Should cite BOTH documents!
   - "According to Fun Friday policy, yes you can wear Hawaiian shirts..."
   - "While working on VAULTRE listings (which require professional photos)..."
   - Should be humorous but helpful

---

### **Step 4: Test RAG with Staff from DIFFERENT Company**

1. **Login as STAFF user** (assigned to a DIFFERENT company, NOT Prestige Property Group)
   - URL: `http://localhost:3000/ai-assistant`

2. **Test Query 1 (Admin Doc - Should Work):**
   ```
   What's the dress code for Fun Friday?
   ```
   
   **Expected Response:**
   - ✅ Should still cite "Fun Friday Policy"
   - ✅ Admin docs are shared with ALL staff
   - Should work the same as Step 3

3. **Test Query 2 (Client Doc - Should NOT Work):**
   ```
   How do I process a property listing in VAULTRE?
   ```
   
   **Expected Response:**
   - ❌ Should NOT cite the VAULTRE guide
   - Should say something like:
     - "I don't have information about VAULTRE in my knowledge base"
     - "You may need to ask your client for specific procedures"
     - "Contact your team lead for client-specific processes"
   - **This proves company isolation is working!**

---

### **Step 5: Verify in Supabase**

1. **Check Documents Table:**
   ```sql
   SELECT 
     id,
     title,
     source,
     "uploadedByRole",
     "sharedWithAll",
     "sharedWith",
     status
   FROM documents
   WHERE title LIKE '%Fun Friday%' 
      OR title LIKE '%VAULTRE%'
   ORDER BY "createdAt" DESC;
   ```

   **Expected:**
   - Fun Friday: `source = 'ADMIN'`, `sharedWithAll = true`
   - VAULTRE: `source = 'CLIENT'`, linked to specific company

2. **Check Embeddings Created:**
   ```sql
   SELECT 
     d.title,
     d.source,
     COUNT(de.id) as chunk_count
   FROM documents d
   LEFT JOIN document_embeddings de ON d.id = de."documentId"
   WHERE d.title LIKE '%Fun Friday%' 
      OR d.title LIKE '%VAULTRE%'
   GROUP BY d.id, d.title, d.source;
   ```

   **Expected:**
   - Fun Friday: 30-40 chunks
   - VAULTRE: 50-60 chunks (it's longer)

---

## 🎯 Success Criteria

### ✅ **Test Passes If:**

1. **Admin Doc Visibility:**
   - ✅ ALL staff can see Fun Friday policy in RAG results
   - ✅ AI cites funny examples from the doc
   - ✅ Works for staff from ANY company

2. **Client Doc Visibility:**
   - ✅ Staff from Prestige Property Group can see VAULTRE guide
   - ❌ Staff from OTHER companies CANNOT see VAULTRE guide
   - ✅ AI accurately cites technical details (photo specs, etc.)

3. **Cross-Document Queries:**
   - ✅ AI can combine info from BOTH docs when relevant
   - ✅ Staff from correct company gets both
   - ✅ Staff from wrong company only gets Admin doc

4. **RAG Processing:**
   - ✅ Both docs process successfully
   - ✅ Embeddings stored in database
   - ✅ Vector search finds relevant chunks
   - ✅ Console logs show processing happening

---

## 🎬 Specific Test Questions

### **For Fun Friday Policy (Admin Doc):**

1. "What can I wear on Fun Friday?"
2. "Are Crocs allowed at work?"
3. "Can I wear a dinosaur costume to work?"
4. "What's NOT allowed on Fun Friday?"
5. "Who created the Fun Friday policy?"

### **For VAULTRE Guide (Client Doc):**

1. "How do I create a listing in VAULTRE?"
2. "What's the minimum number of photos for a property listing?"
3. "How should I order photos in VAULTRE?"
4. "What's a hero shot in real estate?"
5. "What are the price display options for sale properties?"
6. "How do I handle vendor authority forms?"

### **Cross-Document Queries:**

1. "Can I wear casual clothes while working on property listings?"
2. "What should I wear when I'm processing VAULTRE listings on Friday?"
3. "Is there a dress code for BPO staff working on real estate?"

---

## 🐛 Troubleshooting

### **If Staff Can't See Admin Doc:**

- Check `sharedWithAll` is `true` in database
- Check `status` is `APPROVED`
- Check embeddings exist for that document

### **If Staff from WRONG Company Can See Client Doc:**

- **BUG!** Check `vector-search.ts` filtering logic
- Verify `companyId` is being checked
- Check staff user's `companyId` matches document's company

### **If RAG Returns Nothing:**

- Check console logs for vector search
- Verify embeddings were created (check database)
- Try broader query terms
- Check document status is `APPROVED`

---

## 📊 Expected Console Output

### **When Uploading Admin Doc:**
```bash
🤖 [RAG] Queueing document "Fun Friday Dress Code Policy" for embedding generation
📄 [DOCUMENT-PROCESSOR] Starting RAG processing for document: [uuid]
📄 [DOCUMENT-PROCESSOR] Document content length: 18,543 characters
📄 [DOCUMENT-PROCESSOR] Created 34 text chunks
🔑 [EMBEDDINGS] Generating embedding for chunk 1/34...
... (continues)
💾 [DOCUMENT-PROCESSOR] Saved embeddings for 34 chunks
✅ [DOCUMENT-PROCESSOR] RAG processing complete
```

### **When Staff Asks Question:**
```bash
🔍 [VECTOR-SEARCH] Searching for: "What can I wear on Fun Friday?"
📚 [VECTOR-SEARCH] Staff can access 3 documents
✅ [VECTOR-SEARCH] Found 5 relevant chunks
  1. "Fun Friday Dress Code Policy" (similarity: 0.892)
  2. "Fun Friday Dress Code Policy" (similarity: 0.856)
  3. "Fun Friday Dress Code Policy" (similarity: 0.831)
```

---

## 🎊 What This Proves

If all tests pass:

✅ **Admin docs → Global visibility** (all staff can access)  
✅ **Client docs → Company-scoped** (only assigned staff can access)  
✅ **RAG respects permissions** (vector search filters correctly)  
✅ **Multi-document synthesis** (AI combines multiple sources)  
✅ **Company isolation works** (no cross-company data leakage)  

---

## 🚀 Ready to Test!

1. Upload both documents
2. Wait for RAG processing
3. Test with different staff users
4. Verify visibility rules work
5. Celebrate when it works perfectly! 🎉

---

**Created:** November 21, 2025  
**Purpose:** Verify RAG document visibility and company isolation  
**Expected Duration:** 15-20 minutes for full test suite

