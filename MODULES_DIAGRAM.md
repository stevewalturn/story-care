# StoryCare Module Components Usage Flow

## Module Components Distribution

```mermaid
flowchart TD
    subgraph "MODULE"
        A[Domain]
        B[Clinical Description]
        C[Reflection Questions]
        D[AI Prompts]
        E[Survey Bundle]
    end

    subgraph "SESSION ANALYSIS PAGE"
        F[Module Assignment]
        G[Clinical Context Display]
        H[AI Transcript Analysis]
        I[Visual Content Generation]
    end

    subgraph "STORY PAGE BUILDER"
        J[Add Content Blocks]
        K[Patient Reflections]
        L[Survey Questions]
        M[Email Configuration]
    end

    subgraph "PATIENT VIEW"
        N[Published Story Page]
        O[Reflection Responses]
        P[Survey Completion]
    end

    %% Module Components to Pages
    A --> F
    B --> G
    C --> K
    D --> H
    E --> L

    %% Page Workflows
    F --> H
    H --> I
    I --> J
    J --> N
    K --> O
    L --> P
    N --> O
    N --> P

    %% Styling
    classDef module fill:#ffebee,stroke:#c62828,stroke-width:2px
    classDef sessionPage fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef storyBuilder fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef patientView fill:#fff8e1,stroke:#f57f17,stroke-width:2px

    class A,B,C,D,E module
    class F,G,H,I sessionPage
    class J,K,L,M storyBuilder
    class N,O,P patientView
```

**Summary**: This diagram shows exactly where each module component is used:
- **Domain + Description** → Session Analysis Page (for module assignment and clinical context)
- **AI Prompts** → Session Analysis Page (for transcript analysis)
- **Reflection Questions + Survey Bundle** → Story Page Builder (for patient engagement)