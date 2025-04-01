using System;

namespace NotesManager.API.DTOs
{
    public class NoteDto
    {
        public int Id { get; set; }
        public required string Title { get; set; }
        public required string Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public string UserEmail { get; set; }
    }

    public class CreateNoteDto
    {
        public required string Title { get; set; }
        public required string Description { get; set; }
    }

    public class UpdateNoteDto
    {
        public required string Title { get; set; }
        public required string Description { get; set; }
    }

    public class NoteSearchDto
    {
        public string TitleSearch { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }
} 