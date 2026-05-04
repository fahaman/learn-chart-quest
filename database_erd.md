# LearnChart Quest Database Schema (ERD)

This diagram outlines the complete database table (collection) structure and relationships based on the Mongoose models. It explicitly highlights the **Admin** role and its conceptual relationships within the system.

```mermaid
erDiagram
    %% Entities
    USER {
        ObjectId _id PK
        String email "required, unique"
        String username "unique, sparse"
        String name
        String phone
        String password "required"
        Number cash_balance "default 10000.0"
        String role "enum: 'user', 'admin' (default 'user')"
        String resetPasswordToken
        Date resetPasswordExpires
        Date createdAt
        Date updatedAt
    }

    LESSON {
        ObjectId _id PK
        String title "required"
        String description
        String youtube_id "required"
        String level "enum: Beginner, Intermediate, Advanced"
        Number duration_min "default 5"
        Number order_index "default 0"
        Date createdAt
        Date updatedAt
    }

    LESSON_PROGRESS {
        ObjectId _id PK
        ObjectId user_id FK "ref: User"
        String lesson_id FK "logically ref: Lesson"
        Boolean completed "default false"
        Date createdAt
        Date updatedAt
    }

    POSITION {
        ObjectId _id PK
        ObjectId user_id FK "ref: User"
        String symbol "required"
        Number quantity "default 0"
        Number avg_price "default 0"
        Date createdAt
        Date updatedAt
    }

    TRADE {
        ObjectId _id PK
        ObjectId user_id FK "ref: User"
        String symbol "required"
        String side "enum: BUY, SELL"
        Number quantity "required"
        Number price "required"
        Number total "required"
        Date createdAt
        Date updatedAt
    }

    WATCHLIST {
        ObjectId _id PK
        ObjectId user_id FK "ref: User"
        String symbol "required"
        Date createdAt
        Date updatedAt
    }

    ADMIN {
        ObjectId _id FK "Logical subset of User where role='admin'"
    }

    %% Relationships
    USER ||--o{ LESSON_PROGRESS : "has progress"
    USER ||--o{ POSITION : "holds"
    USER ||--o{ TRADE : "executes"
    USER ||--o{ WATCHLIST : "monitors"
    
    %% Admin conceptual relationships
    USER ||--o| ADMIN : "can be"
    ADMIN ||--o{ LESSON : "creates & manages"
    LESSON ||--o{ LESSON_PROGRESS : "tracked by"
```

## Collections & Roles Breakdown

1.  **User**: Stores all users, distinguished by the `role` field.
    - **Regular Users (`role: "user"`)**: Can trade (Positions, Trades, Watchlist) and learn (LessonProgress).
    - **Admins (`role: "admin"`)**: Have the authority to manage the curriculum (create, update, delete `Lesson` documents) and oversee the platform.
2.  **Lesson**: The curriculum catalog containing details about educational videos and content. While not strictly bound by a foreign key to a specific creator, these are conceptually managed exclusively by **Admins**.
3.  **LessonProgress**: Tracks which lessons a particular user has completed. It references the `User` and logically refers to the `Lesson` via `lesson_id`.
4.  **Position**: Represents a user's current open holdings in the market (paper trading portfolio).
5.  **Trade**: A historical log of buy/sell orders executed by the user.
6.  **Watchlist**: Stock symbols that a user has marked to keep an eye on.
