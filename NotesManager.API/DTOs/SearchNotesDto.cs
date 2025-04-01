using System;

namespace NotesManager.API.DTOs
{
    public class SearchNotesDto
    {
        public string TitleSearch { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }
} 