# Knowledge Base Test Queries for Retriever Agent

This document contains targeted test queries to validate the Retriever Agent's performance on the IIT Kharagpur knowledge base.

---

## 📚 **Category 1: Academic & Departments**

### Computer Science & Engineering
1. **"Who is the head of the Computer Science department?"**
   - Expected: Prof. Sudeshna Sarkar (Head of Department)
   - Tests: Faculty information retrieval

2. **"What courses are offered in the CSE department?"**
   - Expected: B.Tech, Dual Degree, M.Tech, Ph.D programs
   - Tests: Program listing

3. **"What are the research interests of Prof. Niloy Ganguly?"**
   - Expected: Complex and Social Networks, Data and Web Mining, Systems and Networking
   - Tests: Faculty-specific information

4. **"What is the CSE curriculum for semester 3?"**
   - Expected: EE29001, CS29003, EC21103, CS21001, EE21101, CS21003, EC29003, HSS
   - Tests: Detailed curriculum information

### Career Development Centre (CDC)
5. **"Who is the chairperson of CDC at IIT Kharagpur?"**
   - Expected: Prof. Sanjay Gupta (Mechanical Engineering)
   - Tests: CDC leadership information

6. **"How can I contact the CDC vice chairperson from Electrical Engineering?"**
   - Expected: Prof. Neeraj Kumar Goyal, Phone: +91 9434741267, Email: ngoyal@hijli.iitkgp.ac.in
   - Tests: Contact information retrieval

7. **"What does CDC do?"**
   - Expected: Campus placements, internship opportunities, industry-academia interaction, career counseling
   - Tests: Understanding of CDC functions

---

## 🏠 **Category 2: Halls of Residence**

### Azad Hall
8. **"Tell me about Azad Hall of Residence"**
   - Expected: Founded 3rd March 1954, motto, current warden Prof. Nikhil Kumar Singha
   - Tests: Hall basic information

9. **"What is KHOJ?"**
   - Expected: The Ultimate Treasure Hunt for Freshers organized by Azad Hall, started in 2000
   - Tests: Hall-specific events

10. **"What are the amenities in Azad Hall?"**
    - Expected: Cultural Room, Music Room, Auditorium, Library, Basketball court, Gym, etc.
    - Tests: Infrastructure details

11. **"Who are some notable alumni from Azad Hall?"**
    - Expected: Arun Sarin, Raj Kamal Jha, Raj Tilak Roushan, Gaurav Taneja, etc.
    - Tests: Alumni information

### General Hall Questions
12. **"How many halls of residence are there in IIT Kharagpur?"**
    - Expected: Multiple halls including Azad, Nehru, JCB, MMM, LBS, etc. (22 halls mentioned in data)
    - Tests: Overall hall count and names

---

## 🎭 **Category 3: Cultural & Technical Events**

### Spring Fest
13. **"What is Spring Fest?"**
    - Expected: Annual social & cultural festival, held in January since 1960, one of India's largest college fests
    - Tests: Event background

14. **"When is Spring Fest held?"**
    - Expected: January, during spring semester, usually around Republic Day (Jan 26)
    - Tests: Timing information

15. **"What are the flagship events of Spring Fest?"**
    - Expected: Wildfire (rock band), Shuffle (street dance), Nukkad (street play), Centrifuge, Rangmanch
    - Tests: Event-specific details

16. **"Who has performed at Spring Fest?"**
    - Expected: KK, Shaan, Salim-Sulaiman, Sunidhi Chauhan, Shankar Mahadevan, etc.
    - Tests: Guest/performer history

### Kharagpur Winter of Code (KWoC)
17. **"What is KWoC?"**
    - Expected: 5-week open-source program by KOSS, helps students contribute to open-source
    - Tests: Technical event understanding

18. **"Who organizes KWoC?"**
    - Expected: Kharagpur Open Source Society (KOSS)
    - Tests: Organizing body information

19. **"When does KWoC happen?"**
    - Expected: November to January, annually since 2016
    - Tests: Event timeline

---

## 📖 **Category 4: Facilities & Services**

### Central Library
20. **"What are the Central Library timings?"**
    - Expected: 8 AM to 12 Midnight, except public holidays; extended during exams
    - Tests: Service hours

21. **"How many books can an undergraduate student borrow?"**
    - Expected: 5 books for 60 days (13 books for SC/ST students for 90 days)
    - Tests: Specific rules and policies

22. **"What is the fine for overdue library books?"**
    - Expected: Re 1/- per day after due date
    - Tests: Fine structure

23. **"Where is the Central Library located?"**
    - Expected: Entrance of Main Building
    - Tests: Location information

24. **"What halls does the Central Library have?"**
    - Expected: Basement, Hall 1-6, Annex Building with different collections
    - Tests: Library structure

---

## 📝 **Category 5: How-To Guides (Procedural Knowledge)**

25. **"How do I get a department change?"**
    - Tests: Procedural knowledge retrieval

26. **"How can I book a classroom?"**
    - Tests: Administrative procedures

27. **"How do I prepare for GATE?"**
    - Tests: Academic preparation guides

28. **"How to get a bonafide certificate?"**
    - Tests: Document-related procedures

29. **"How do I apply for an internship NOC?"**
    - Tests: Internship-related procedures

---

## 🔬 **Category 6: Student Organizations & Clubs**

30. **"What is KOSS?"**
    - Expected: Kharagpur Open Source Society, organizes KWoC
    - Tests: Student group information

31. **"Tell me about the Developers' Society"**
    - Tests: Technical club information

32. **"What student-run research groups exist?"**
    - Tests: Research group listing

---

## 🏆 **Category 7: General Championships & Competitions**

33. **"What is the General Championship?"**
    - Expected: Inter-hall competition across Sports, Technology, Social & Cultural
    - Tests: Competition structure

34. **"How did Azad Hall perform in the 2018-19 General Championship?"**
    - Expected: Gold in Sports, Silver in Technology, Bronze in Social & Cultural
    - Tests: Historical performance data

---

## 🎓 **Category 8: Complex Multi-Entity Queries**

35. **"Which professors in the CSE department work on AI and machine learning?"**
    - Expected: Prof. Sudeshna Sarkar (Machine Learning, NLP), Prof. Animesh Mukherjee (AI), etc.
    - Tests: Multi-attribute filtering

36. **"What cultural events happen in January at IIT Kharagpur?"**
    - Expected: Spring Fest (late January), KWoC ends in January
    - Tests: Temporal reasoning

37. **"Compare the facilities of Azad Hall and the Central Library"**
    - Tests: Multi-entity comparison

---

## 🔍 **Category 9: Ambiguous/Context-Requiring Queries**

38. **"Who is Prof. Neeraj Kumar Goyal?"**
    - Expected: CDC Vice Chairperson, Electrical Engineering department
    - Tests: Person disambiguation (note: same name as your project mentor!)

39. **"What is CDC?"**
    - Expected: Career Development Centre (could also be confused with other acronyms)
    - Tests: Acronym expansion

40. **"Tell me about JCB"**
    - Expected: Jagdish Chandra Bose Hall of Residence
    - Tests: Abbreviation understanding

---

## ❌ **Category 10: Out-of-Scope Queries (Should Use Web Search)**

41. **"What is the weather in Kharagpur today?"**
    - Expected: Should trigger web search agent
    - Tests: Real-time data detection

42. **"Who won the last IPL match?"**
    - Expected: Should trigger web search agent
    - Tests: Current events detection

43. **"What are the latest research papers on quantum computing?"**
    - Expected: Should trigger web search or academic search
    - Tests: Recent research detection

---

## 📊 **Testing Strategy**

### Performance Metrics to Track:
1. **Retrieval Accuracy**: Does it retrieve the correct documents?
2. **Answer Completeness**: Is the full answer provided?
3. **Relevance Ranking**: Are the most relevant chunks ranked highest?
4. **Response Time**: How fast is the retrieval?
5. **Source Attribution**: Are sources properly cited?
6. **Fallback Behavior**: Does it gracefully handle missing information?

### Expected Behavior:
- ✅ Queries 1-40 should primarily use **Retriever Agent** (KB)
- 🌐 Queries 41-43 should trigger **Web Search Agent**
- 🤖 All queries should get orchestrated properly by **Orchestrator Agent**

---

## 🎯 **Recommended Testing Order**

1. **Start with simple factual queries** (1-7)
2. **Test specific entity retrieval** (8-24)
3. **Test procedural knowledge** (25-29)
4. **Test complex queries** (35-37)
5. **Test edge cases** (38-43)

---

## 📝 **Logging Tips**

For each query, log:
```
Query: [your question]
Agent Path: [which agents were used]
Retrieval Time: [ms]
Sources Used: [list of sources]
Answer Quality: [1-5 rating]
Notes: [any observations]
```

---

Happy Testing! 🚀

