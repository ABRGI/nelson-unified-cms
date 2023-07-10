# nelson-unified-cms
Unified CMS to manage content for client website, guest comms, but, etc.

## High-level diagram
```mermaid
graph LR
    subgraph "Editor layer"
        e(Editor layer)
    end

    subgraph "AI API layer"
        a(AI api layer)
    end

    subgraph "MUI"
        m(MUI)
    end

    subgraph "SSG"
        n(Next.js)
    end

    subgraph "DynamoDB"
        d(DynamoDB)
    end

    e---get---a
    e---iframe---m
    n---getStaticProps---d
    e---save--->d
   ```