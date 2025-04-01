using System;
using System.ComponentModel.DataAnnotations;

namespace NotesManager.API.Models
{
    public class Note
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; }

        [Required]
        public string Description { get; set; }

        public DateTime CreatedAt { get; set; }

        public string UserId { get; set; }

        public ApplicationUser User { get; set; }

        public bool IsPublic { get; set; } = true;
    }
} 