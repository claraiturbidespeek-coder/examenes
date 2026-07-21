/**
 * Tipos de la tabla exam_pages, escritos a mano para que coincidan con
 * supabase/migrations/0001_exam_pages.sql. Si cambias la migración, cambia esto.
 *
 * La forma (Relationships, Views, Functions…) es la que genera `supabase gen
 * types` y la que espera el cliente de supabase-js para inferir Row/Insert.
 */
export type Database = {
  public: {
    Tables: {
      exam_pages: {
        Row: {
          id: string;
          client_slug: string;
          language: string;
          client_name: string;
          destination_url: string;
          legacy_client_id: string | null;
          old_wordpress_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_slug: string;
          language: string;
          client_name: string;
          destination_url: string;
          legacy_client_id?: string | null;
          old_wordpress_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_slug?: string;
          language?: string;
          client_name?: string;
          destination_url?: string;
          legacy_client_id?: string | null;
          old_wordpress_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type ExamPage = Database["public"]["Tables"]["exam_pages"]["Row"];
export type ExamPageInsert = Database["public"]["Tables"]["exam_pages"]["Insert"];
