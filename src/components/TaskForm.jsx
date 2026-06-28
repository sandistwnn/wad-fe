import { useForm } from "react-hook-form";
import { useEffect } from "react";

export function TaskForm({ onSubmit, onCancel, initialData = null }) {
  const isEdit = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: initialData || {
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      dueDate: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      // Pastikan format tanggal untuk input type="date" adalah YYYY-MM-DD
      const formattedData = {
        ...initialData,
        dueDate: initialData.dueDate ? initialData.dueDate.split("T")[0] : "",
      };
      reset(formattedData);
    }
  }, [initialData, reset]);

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>{isEdit ? "Edit Task" : "Buat Task Baru"}</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label>Judul *</label>
            <input {...register("title", { required: "Judul wajib diisi" })} />
            {errors.title && (
              <span className="error">{errors.title.message}</span>
            )}
          </div>

          <div className="form-group">
            <label>Deskripsi</label>
            <textarea rows={3} {...register("description")} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Status</label>
              <select {...register("status")}>
                <option value="todo">Belum Dimulai</option>
                <option value="in_progress">Sedang Dikerjakan</option>
                <option value="done">Selesai</option>
              </select>
            </div>
            <div className="form-group">
              <label>Prioritas</label>
              <select {...register("priority")}>
                <option value="low">Rendah</option>
                <option value="medium">Sedang</option>
                <option value="high">Tinggi</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Tenggat Waktu</label>
            <input 
              type="date" 
              {...register("dueDate", {
                // PERUBAHAN PENTING: Jika input kosong, kirim null agar backend tidak error
                setValueAs: (value) => (value === "" ? null : value),
              })} 
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn-secondary">
              Batal
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Buat Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}