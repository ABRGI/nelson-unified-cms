export interface Content {
    id: number;
    title: string;
    content: string;
}

export interface HomeProps {
    content: Content[];
}