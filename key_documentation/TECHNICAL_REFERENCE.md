# Song Ranker - Technical Reference

**Last Updated**: January 2025  
**Purpose**: Complete technical documentation for developers  
**Status**: ✅ **ACTIVE** - Technical reference guide

---

## 🏗️ **System Architecture**

### **Overview**
Song Ranker is a Next.js application using the App Router architecture. The application connects to Supabase for database operations.

### **Architecture Diagram**
```
User Browser
    ↓
Next.js App (Frontend)
    ↓
Supabase Client (lib/supabase.ts)
    ↓
Supabase (PostgreSQL Database)
```

### **Key Components**
- **Frontend**: Next.js App Router with React components
- **Database**: Supabase (PostgreSQL) with client-side access
- **Styling**: Tailwind CSS for utility-first styling
- **Type Safety**: TypeScript throughout

---

## 📁 **Code Organization**

### **File Structure**
```
Song Ranker/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout component
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── lib/                   # Utility libraries
│   └── supabase.ts       # Supabase client singleton
├── public/                # Static assets
└── [config files]        # Next.js, TypeScript, ESLint configs
```

### **Key Files**

#### **`lib/supabase.ts`**
**Purpose**: Supabase client configuration and singleton instance

**Key Features**:
- Creates Supabase client with environment variables
- Validates required environment variables
- Exports singleton instance for use throughout app

**Usage**:
```typescript
import { supabase } from '@/lib/supabase'

// Use supabase client for database operations
const { data, error } = await supabase
  .from('table_name')
  .select('*')
```

**Environment Variables Required**:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon public key

---

## 🔌 **API Reference**

### **Supabase Client API**

The Supabase client is accessed via `lib/supabase.ts`:

```typescript
import { supabase } from '@/lib/supabase'
```

**Common Operations**:

#### **Select Data**
```typescript
const { data, error } = await supabase
  .from('table_name')
  .select('*')
```

#### **Insert Data**
```typescript
const { data, error } = await supabase
  .from('table_name')
  .insert([{ column: 'value' }])
```

#### **Update Data**
```typescript
const { data, error } = await supabase
  .from('table_name')
  .update({ column: 'new_value' })
  .eq('id', 1)
```

#### **Delete Data**
```typescript
const { data, error } = await supabase
  .from('table_name')
  .delete()
  .eq('id', 1)
```

---

## 🔗 **Integration Guide**

### **Supabase Integration**

#### **Setup**
1. Create Supabase project at https://supabase.com
2. Get project URL and anon key from Settings → API
3. Add to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Import and use client:
   ```typescript
   import { supabase } from '@/lib/supabase'
   ```

#### **Current Configuration**
- **URL**: https://loqddpjjjakaqgtuvoyn.supabase.co
- **Client**: Configured in `lib/supabase.ts`
- **Security**: Uses anon key (respects Row Level Security)

#### **Best Practices**
- Always check for errors after Supabase operations
- Use TypeScript types for table schemas
- Implement proper error handling
- Use RLS policies for data security

---

## 🛠️ **Development Setup**

### **Prerequisites**
- Node.js 20+ (check with `node --version`)
- npm (comes with Node.js)
- Git

### **Installation Steps**

1. **Clone Repository**:
   ```bash
   git clone https://github.com/svadrutk/songranker.git
   cd songranker
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**:
   Create `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://loqddpjjjakaqgtuvoyn.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

5. **Open Browser**:
   Navigate to http://localhost:3000

### **Available Scripts**

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

### **Environment Variables**

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key | Yes |

**Note**: All environment variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

---

## 💻 **Code Examples**

### **Supabase Client Usage**

#### **Basic Query**
```typescript
import { supabase } from '@/lib/supabase'

async function getTracks() {
  const { data, error } = await supabase
    .from('tracks')
    .select('*')
    .limit(10)
  
  if (error) {
    console.error('Error fetching tracks:', error)
    return []
  }
  
  return data
}
```

#### **Error Handling Pattern**
```typescript
const { data, error } = await supabase
  .from('table_name')
  .select('*')

if (error) {
  // Handle error
  console.error('Supabase error:', error)
  return
}

// Use data
console.log('Data:', data)
```

#### **Type-Safe Queries** (Future)
```typescript
// Define types for your tables
interface Track {
  id: string
  name: string
  artist: string
  // ... other fields
}

// Use with Supabase
const { data, error } = await supabase
  .from('tracks')
  .select('*')
  .returns<Track[]>()
```

---

## 🔧 **Configuration Files**

### **`next.config.ts`**
Next.js configuration. Currently using default settings.

### **`tsconfig.json`**
TypeScript configuration with Next.js recommended settings.

### **`tailwind.config.js`** (if exists)
Tailwind CSS configuration. Using Tailwind 4 with PostCSS.

### **`eslint.config.mjs`**
ESLint configuration with Next.js recommended rules.

---

## 📚 **Technology Stack Details**

### **Next.js 16.1.3**
- **App Router**: Modern routing with file-based system
- **Server Components**: Default React Server Components
- **Client Components**: Use `'use client'` directive when needed

### **React 19.2.3**
- Latest React version
- Server Components support
- Improved performance

### **TypeScript 5**
- Strict type checking
- Better IDE support
- Compile-time error detection

### **Tailwind CSS 4**
- Utility-first CSS framework
- PostCSS integration
- JIT compilation

### **Supabase**
- PostgreSQL database
- Real-time subscriptions
- Row Level Security (RLS)
- Built-in authentication (if needed)

---

## 🚀 **Deployment Considerations**

### **Environment Variables**
- Ensure all `NEXT_PUBLIC_` variables are set in deployment platform
- Never commit `.env.local` to git (already in `.gitignore`)

### **Build Process**
- Run `npm run build` to test production build locally
- Check for build errors before deploying

### **Supabase Configuration**
- Verify RLS policies are set correctly
- Test database connections in production environment

---

## 📐 **Theoretical Concepts**

This section documents the theoretical foundations and algorithms used in the Song Ranker project.

---

### **Bradley-Terry Model for Music Preference Sorting**

The Bradley-Terry model is the core ranking algorithm for this project. It's specifically designed to infer a complete ranking from pairwise comparisons, making it perfect for music preference sorting. Instead of asking users to rank all songs at once (overwhelming with 50-200 items), we present two songs at a time and build up a probabilistic strength model.

**Reference**: [Wikipedia - Bradley-Terry Model](https://en.wikipedia.org/wiki/Bradley%E2%80%93Terry_model)

#### **How It Works**

Each song gets assigned a strength parameter \(p_i\), and when a user chooses song \(i\) over song \(j\), we observe that \(i\) "won" that comparison. The model estimates the probability that users prefer song \(i\) to song \(j\) as:

\[ \Pr(i \text{ beats } j) = \frac{p_i}{p_i + p_j} \]

After collecting multiple comparisons, we use maximum likelihood estimation to find the optimal strength values for all songs, then rank them by their estimated \(p_i\) values.

**Reference**: [DRatings - Creating a Ratings Model with Bradley-Terry](https://www.dratings.com/creating-a-ratings-model-with-bradley-terry/)

#### **Implementation Strategy**

**Data Collection**: Each time a user picks a song, record it as \(w_{ij} = 1\) (song \(i\) beat song \(j\)). For ties, we can either skip recording or use a Bradley-Terry extension that handles draws.

**Reference**: [CRAN - BradleyTerry2 Package](https://cran.r-project.org/web/packages/BradleyTerry2/vignettes/BradleyTerry.html)

**Adaptive Questioning**: We don't need all \(n(n-1)/2\) possible comparisons. Start with a random sample, then strategically select pairs where the model is most uncertain (songs with similar estimated \(p_i\) values). This minimizes comparisons while maximizing information gain.

**Reference**: [DRatings - Creating a Ratings Model with Bradley-Terry](https://www.dratings.com/creating-a-ratings-model-with-bradley-terry/)

**Parameter Estimation**: Use iterative algorithms like MM (minorization-maximization) or Newton-Raphson to solve for the strength parameters. The log-likelihood function we're maximizing is based on observed wins and losses across all comparisons.

**Reference**: [Emergent Mind - Bradley-Terry Ranking System](https://www.emergentmind.com/topics/bradley-terry-ranking-system)

**Handling Contradictions**: Bradley-Terry naturally handles inconsistent choices because it's probabilistic. If a user picks song A over B once but B over A later, the model treats these as statistical observations rather than absolute rules, weighting the more frequent choice.

**Reference**: [James Howard - Bradley-Terry Model and Data-Driven Ranking](https://jameshoward.us/2025/01/31/bradley-terry-model-and-data-driven-ranking)

#### **Completion Criteria**

**Minimum Comparisons**: We need at least \(n-1\) comparisons to connect all items in a preference graph, but practical convergence typically requires \(O(n \log n)\) comparisons.

**Reference**: [DRatings - Creating a Ratings Model with Bradley-Terry](https://www.dratings.com/creating-a-ratings-model-with-bradley-terry/)

**Confidence Threshold**: Stop when the standard errors of parameter estimates fall below a threshold, or when the ranking order stops changing between iterations. Calculate this by monitoring the Fisher information matrix during estimation.

**Reference**: [Emergent Mind - Bradley-Terry Ranking System](https://www.emergentmind.com/topics/bradley-terry-ranking-system)

**Progress Tracking**: Display progress as `comparisons_made / estimated_total`, where estimated total is based on current model uncertainty. Update this dynamically as high-certainty songs require fewer future comparisons.

#### **Advantages for Project Requirements**

The Bradley-Terry approach excels at:
- **Handling incomplete comparison graphs**: Users can refresh mid-session and resume without breaking the model
- **Non-transitive preferences**: Resolved by finding the maximum likelihood ranking that best explains all observations (e.g., A>B, B>C, C>A)
- **Confidence scores**: Provides confidence scores for each ranking position by examining standard errors of estimated parameters (perfect for stretch goal)
- **Probabilistic nature**: Treats user choices as statistical observations, naturally handling contradictions

**Reference**: [James Howard - Bradley-Terry Model and Data-Driven Ranking](https://jameshoward.us/2025/01/31/bradley-terry-model-and-data-driven-ranking)

---

## 📝 **Development Notes**

### **Current Implementation**
- Basic Next.js setup complete
- Supabase client configured
- Bradley-Terry model selected as core ranking algorithm
- Ready for feature development

### **Future Considerations**
- Database schema design (optimized for Bradley-Terry data collection)
- API route implementation for ranking calculations
- Parameter estimation algorithm implementation (MM or Newton-Raphson)
- Adaptive pair selection strategy
- Confidence score calculation

---

**Document Status**: ✅ **CURRENT** - Technical reference maintained  
**Next Update**: When code architecture changes or new integrations added
