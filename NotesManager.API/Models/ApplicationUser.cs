using Microsoft.AspNetCore.Identity;
using System.Collections.Generic;

namespace NotesManager.API.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Description { get; set; } = string.Empty;
        public ICollection<Note> Notes { get; set; }
    }
} 