export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      administradores: {
        Row: {
          created_at: string
          id: string
          password: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          password: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          password?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      agente_seguridad: {
        Row: {
          agente: string | null
          created_at: string
          fecha: string
          fin_servicio: string
          id: string
          seguridad: string
          servicio: string
          updated_at: string
        }
        Insert: {
          agente?: string | null
          created_at?: string
          fecha: string
          fin_servicio: string
          id?: string
          seguridad: string
          servicio: string
          updated_at?: string
        }
        Update: {
          agente?: string | null
          created_at?: string
          fecha?: string
          fin_servicio?: string
          id?: string
          seguridad?: string
          servicio?: string
          updated_at?: string
        }
        Relationships: []
      }
      biometric_credentials: {
        Row: {
          created_at: string | null
          id: string
          last_used: string | null
          public_key: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          last_used?: string | null
          public_key: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_used?: string | null
          public_key?: string
          user_id?: string | null
        }
        Relationships: []
      }
      cumplimiento_turnos: {
        Row: {
          created_at: string
          cumplimiento_porcentaje: number | null
          empleado_id: string
          entrada_real: string | null
          fecha: string
          id: string
          minutos_retraso_entrada: number | null
          minutos_retraso_salida: number | null
          observaciones: string | null
          salida_real: string | null
          turno_programado_entrada: string | null
          turno_programado_salida: string | null
          ubicacion: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cumplimiento_porcentaje?: number | null
          empleado_id: string
          entrada_real?: string | null
          fecha: string
          id?: string
          minutos_retraso_entrada?: number | null
          minutos_retraso_salida?: number | null
          observaciones?: string | null
          salida_real?: string | null
          turno_programado_entrada?: string | null
          turno_programado_salida?: string | null
          ubicacion: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cumplimiento_porcentaje?: number | null
          empleado_id?: string
          entrada_real?: string | null
          fecha?: string
          id?: string
          minutos_retraso_entrada?: number | null
          minutos_retraso_salida?: number | null
          observaciones?: string | null
          salida_real?: string | null
          turno_programado_entrada?: string | null
          turno_programado_salida?: string | null
          ubicacion?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cumplimiento_turnos_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "empleados"
            referencedColumns: ["id"]
          },
        ]
      }
      empleados: {
        Row: {
          active: boolean | null
          apellidos: string
          cedula: string | null
          created_at: string
          foto: string | null
          funcion: string
          id: string
          last_login: string | null
          nombres: string
          password_hash: string | null
          requires_password_change: boolean | null
          ubicacion_designada: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          apellidos: string
          cedula?: string | null
          created_at?: string
          foto?: string | null
          funcion: string
          id?: string
          last_login?: string | null
          nombres: string
          password_hash?: string | null
          requires_password_change?: boolean | null
          ubicacion_designada?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          apellidos?: string
          cedula?: string | null
          created_at?: string
          foto?: string | null
          funcion?: string
          id?: string
          last_login?: string | null
          nombres?: string
          password_hash?: string | null
          requires_password_change?: boolean | null
          ubicacion_designada?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      empleados_turnos: {
        Row: {
          active: boolean
          apellidos: string
          cedula: string | null
          created_at: string
          funcion: string
          id: string
          nombres: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          apellidos: string
          cedula?: string | null
          created_at?: string
          funcion: string
          id?: string
          nombres: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          apellidos?: string
          cedula?: string | null
          created_at?: string
          funcion?: string
          id?: string
          nombres?: string
          updated_at?: string
        }
        Relationships: []
      }
      registros: {
        Row: {
          agente: string
          apellido: string | null
          cedula: string | null
          created_at: string
          fecha: string
          fin_servicio: string
          funcion: string | null
          hora: string
          id: string
          matricula: string | null
          nombre: string | null
          seguridad: string
          servicio: string
          tipo: string
          tipo_persona: string
          updated_at: string
        }
        Insert: {
          agente: string
          apellido?: string | null
          cedula?: string | null
          created_at?: string
          fecha: string
          fin_servicio: string
          funcion?: string | null
          hora: string
          id?: string
          matricula?: string | null
          nombre?: string | null
          seguridad: string
          servicio: string
          tipo: string
          tipo_persona: string
          updated_at?: string
        }
        Update: {
          agente?: string
          apellido?: string | null
          cedula?: string | null
          created_at?: string
          fecha?: string
          fin_servicio?: string
          funcion?: string | null
          hora?: string
          id?: string
          matricula?: string | null
          nombre?: string | null
          seguridad?: string
          servicio?: string
          tipo?: string
          tipo_persona?: string
          updated_at?: string
        }
        Relationships: []
      }
      turnos_empleados: {
        Row: {
          created_at: string | null
          empleado_id: string | null
          fecha: string
          foto_entrada: string | null
          foto_salida: string | null
          hora_entrada: string | null
          hora_salida: string | null
          id: string
          tipo_registro: string | null
          ubicacion_entrada: unknown | null
          ubicacion_salida: unknown | null
        }
        Insert: {
          created_at?: string | null
          empleado_id?: string | null
          fecha: string
          foto_entrada?: string | null
          foto_salida?: string | null
          hora_entrada?: string | null
          hora_salida?: string | null
          id?: string
          tipo_registro?: string | null
          ubicacion_entrada?: unknown | null
          ubicacion_salida?: unknown | null
        }
        Update: {
          created_at?: string | null
          empleado_id?: string | null
          fecha?: string
          foto_entrada?: string | null
          foto_salida?: string | null
          hora_entrada?: string | null
          hora_salida?: string | null
          id?: string
          tipo_registro?: string | null
          ubicacion_entrada?: unknown | null
          ubicacion_salida?: unknown | null
        }
        Relationships: [
          {
            foreignKeyName: "turnos_empleados_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "empleados"
            referencedColumns: ["id"]
          },
        ]
      }
      user_2fa: {
        Row: {
          backup_codes: string[] | null
          created_at: string | null
          enabled: boolean | null
          id: string
          last_used_at: string | null
          secret: string
          user_id: string | null
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          last_used_at?: string | null
          secret: string
          user_id?: string | null
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          last_used_at?: string | null
          secret?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          active: boolean
          created_at: string
          id: string
          requires_password_change: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          requires_password_change?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          requires_password_change?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          created_at: string
          id: string
          password: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          password: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          password?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      visitor_cache: {
        Row: {
          apellido: string
          cedula: string
          created_at: string
          id: string
          last_used: string
          matricula: string | null
          nombre: string
          updated_at: string
        }
        Insert: {
          apellido: string
          cedula: string
          created_at?: string
          id?: string
          last_used?: string
          matricula?: string | null
          nombre: string
          updated_at?: string
        }
        Update: {
          apellido?: string
          cedula?: string
          created_at?: string
          id?: string
          last_used?: string
          matricula?: string | null
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      authenticate_empleado: {
        Args: { p_cedula: string; p_password: string }
        Returns: {
          apellidos: string
          empleado_id: string
          funcion: string
          nombres: string
          requires_password_change: boolean
          ubicacion_designada: string
        }[]
      }
      change_empleado_password: {
        Args: { p_empleado_id: string; p_new_password: string }
        Returns: boolean
      }
      create_empleado_with_password: {
        Args: {
          p_apellidos: string
          p_cedula?: string
          p_funcion: string
          p_nombres: string
          p_password?: string
          p_ubicacion?: string
        }
        Returns: string
      }
      exec_sql: {
        Args: { params?: string[]; query: string }
        Returns: {
          result: Json
        }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      setup_initial_users: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      setup_user_profile: {
        Args: {
          p_email: string
          p_role?: Database["public"]["Enums"]["user_role"]
          p_username: string
        }
        Returns: string
      }
    }
    Enums: {
      user_role: "administrador" | "agente_seguridad" | "cliente"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["administrador", "agente_seguridad", "cliente"],
    },
  },
} as const
