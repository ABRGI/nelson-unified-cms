When you run the following `npm start` first time, you have to comment the following line `await dropTable();` from the file `main.js`. You can find it from the bottom part of the code.

### DB diagram
Here is highlevel diagram over the db structure. Sections is example of how the mapping works.
```mermaid
classDiagram

class NUC {
    environments: Map
    +PK: clientId: String (HASH)
}

class Environments {
    prod: Map
    dev: Map
}

class Prod {
    sections: Map
}

class Dev {
    sections: Map
}

class Sections {
    hero: Map
    experiences: Map
    gallery: Map
    howitworks: Map
    faq: Map
    longerstays: Map
    location: Map
}

class Attribute {
    show: Boolean
    content: String
    selector: String
    type: String
}

NUC "1" --> "1" Environments : contains
Environments "1" --> "1" Prod : contains
Environments "1" --> "1" Dev : contains
Prod "1" --> "1" Sections : contains
Dev "1" --> "1" Sections : contains
Sections "1" --> "*" Attribute : each Map contains
```