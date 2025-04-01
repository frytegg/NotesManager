using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NotesManager.API.Data;
using NotesManager.API.DTOs;
using NotesManager.API.Models;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace NotesManager.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class NotesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<NotesController> _logger;

        public NotesController(ApplicationDbContext context, ILogger<NotesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        private string GetUserId()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation($"Getting user ID from claims. Found: {userId}");
            _logger.LogInformation($"All claims: {string.Join(", ", User.Claims.Select(c => $"{c.Type}: {c.Value}"))}");
            
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogError("User ID not found in claims");
                return null;
            }

            return userId;
        }

        [HttpGet]
        public async Task<IActionResult> GetNotes()
        {
            _logger.LogInformation("Starting GetNotes request");
            
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogError("User ID is null or empty");
                return Unauthorized("User ID not found in token");
            }

            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
                if (user == null)
                {
                    _logger.LogError($"User with ID {userId} not found in database");
                    return Unauthorized("User not found");
                }

                _logger.LogInformation($"Fetching notes for user {userId}");
                var notes = await _context.Notes
                    .Where(n => n.UserId == userId)
                    .OrderByDescending(n => n.CreatedAt)
                    .Select(n => new NoteDto
                    {
                        Id = n.Id,
                        Title = n.Title,
                        Description = n.Description,
                        CreatedAt = n.CreatedAt
                    })
                    .ToListAsync();

                _logger.LogInformation($"Found {notes.Count} notes for user {userId}");
                return Ok(notes);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching notes: {ex.Message}");
                _logger.LogError($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, "An error occurred while fetching notes");
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetNote(int id)
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogError("User ID is null or empty");
                return Unauthorized();
            }

            // Vérifier si l'utilisateur existe
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                _logger.LogError($"User with ID {userId} not found in database");
                return Unauthorized();
            }

            var note = await _context.Notes
                .Where(n => n.Id == id && n.UserId == userId)
                .Select(n => new NoteDto
                {
                    Id = n.Id,
                    Title = n.Title,
                    Description = n.Description,
                    CreatedAt = n.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (note == null)
                return NotFound();

            return Ok(note);
        }

        [HttpPost]
        public async Task<IActionResult> CreateNote(CreateNoteDto noteDto)
        {
            _logger.LogInformation("Starting CreateNote request");
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogError("User ID is null or empty");
                return Unauthorized("User ID not found in token");
            }

            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
                if (user == null)
                {
                    _logger.LogError($"User with ID {userId} not found in database");
                    return Unauthorized("User not found");
                }

                _logger.LogInformation($"Creating note for user {userId}");
                var note = new Note
                {
                    Title = noteDto.Title,
                    Description = noteDto.Description,
                    CreatedAt = DateTime.UtcNow,
                    UserId = userId,
                    IsPublic = true
                };

                _context.Notes.Add(note);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Note created successfully with ID {note.Id} for user {userId}");
                return Ok(new NoteDto
                {
                    Id = note.Id,
                    Title = note.Title,
                    Description = note.Description,
                    CreatedAt = note.CreatedAt,
                    UserEmail = user.Email
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating note: {ex.Message}");
                return StatusCode(500, "An error occurred while creating the note");
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateNote(int id, UpdateNoteDto noteDto)
        {
            _logger.LogInformation($"Starting UpdateNote request for note {id}");
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogError("User ID is null or empty");
                return Unauthorized("User ID not found in token");
            }

            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
                if (user == null)
                {
                    _logger.LogError($"User with ID {userId} not found in database");
                    return Unauthorized("User not found");
                }

                var note = await _context.Notes.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);
                if (note == null)
                {
                    _logger.LogError($"Note {id} not found for user {userId}");
                    return NotFound("Note not found");
                }

                note.Title = noteDto.Title;
                note.Description = noteDto.Description;

                await _context.SaveChangesAsync();
                _logger.LogInformation($"Note {id} updated successfully for user {userId}");

                return Ok(new NoteDto
                {
                    Id = note.Id,
                    Title = note.Title,
                    Description = note.Description,
                    CreatedAt = note.CreatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating note: {ex.Message}");
                return StatusCode(500, "An error occurred while updating the note");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNote(int id)
        {
            _logger.LogInformation($"Starting DeleteNote request for note {id}");
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogError("User ID is null or empty");
                return Unauthorized("User ID not found in token");
            }

            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
                if (user == null)
                {
                    _logger.LogError($"User with ID {userId} not found in database");
                    return Unauthorized("User not found");
                }

                var note = await _context.Notes.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);
                if (note == null)
                {
                    _logger.LogError($"Note {id} not found for user {userId}");
                    return NotFound("Note not found");
                }

                _context.Notes.Remove(note);
                await _context.SaveChangesAsync();
                _logger.LogInformation($"Note {id} deleted successfully for user {userId}");

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting note: {ex.Message}");
                return StatusCode(500, "An error occurred while deleting the note");
            }
        }

        [HttpGet("public")]
        public async Task<ActionResult<IEnumerable<NoteDto>>> GetPublicNotes([FromQuery] SearchNotesDto searchDto)
        {
            try
            {
                _logger.LogInformation("Starting GetPublicNotes request");
                
                var query = _context.Notes
                    .Include(n => n.User)
                    .Where(n => n.IsPublic)
                    .AsQueryable();

                if (!string.IsNullOrWhiteSpace(searchDto.TitleSearch))
                {
                    query = query.Where(n => n.Title.Contains(searchDto.TitleSearch));
                }

                if (searchDto.FromDate.HasValue)
                {
                    query = query.Where(n => n.CreatedAt >= searchDto.FromDate.Value);
                }

                if (searchDto.ToDate.HasValue)
                {
                    query = query.Where(n => n.CreatedAt <= searchDto.ToDate.Value);
                }

                var notes = await query
                    .OrderByDescending(n => n.CreatedAt)
                    .Select(n => new NoteDto
                    {
                        Id = n.Id,
                        Title = n.Title,
                        Description = n.Description,
                        CreatedAt = n.CreatedAt,
                        UserEmail = n.User.Email
                    })
                    .ToListAsync();

                _logger.LogInformation($"Found {notes.Count} public notes");
                return Ok(notes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting public notes");
                return StatusCode(500, "An error occurred while fetching public notes");
            }
        }

        [HttpGet("public/search-by-title")]
        [AllowAnonymous]
        public async Task<IActionResult> SearchPublicNotesByTitle([FromQuery] string titleSearch)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(titleSearch))
                {
                    return BadRequest(new { message = "Search term cannot be empty" });
                }

                var notes = await _context.Notes
                    .Include(n => n.User)
                    .Where(n => n.IsPublic && n.Title.ToLower().Contains(titleSearch.ToLower()))
                    .OrderByDescending(n => n.CreatedAt)
                    .Select(n => new NoteDto
                    {
                        Id = n.Id,
                        Title = n.Title,
                        Description = n.Description,
                        CreatedAt = n.CreatedAt,
                        UserEmail = n.User.Email
                    })
                    .ToListAsync();

                return Ok(notes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while searching notes by title");
                return StatusCode(500, new { message = "An error occurred while searching notes" });
            }
        }

        [HttpGet("public/search-by-date")]
        [AllowAnonymous]
        public async Task<IActionResult> SearchPublicNotesByDate([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
        {
            try
            {
                if (!fromDate.HasValue && !toDate.HasValue)
                {
                    return BadRequest(new { message = "At least one date must be provided" });
                }

                if (fromDate.HasValue && toDate.HasValue && fromDate.Value > toDate.Value)
                {
                    return BadRequest(new { message = "Start date must be before end date" });
                }

                var query = _context.Notes
                    .Include(n => n.User)
                    .Where(n => n.IsPublic);

                if (fromDate.HasValue)
                {
                    query = query.Where(n => n.CreatedAt >= fromDate.Value);
                }

                if (toDate.HasValue)
                {
                    var endDate = toDate.Value.AddDays(1);
                    query = query.Where(n => n.CreatedAt < endDate);
                }

                var notes = await query
                    .OrderByDescending(n => n.CreatedAt)
                    .Select(n => new NoteDto
                    {
                        Id = n.Id,
                        Title = n.Title,
                        Description = n.Description,
                        CreatedAt = n.CreatedAt,
                        UserEmail = n.User.Email
                    })
                    .ToListAsync();

                return Ok(notes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while searching notes by date");
                return StatusCode(500, new { message = "An error occurred while searching notes" });
            }
        }

        [HttpGet("search-by-title")]
        public async Task<IActionResult> SearchNotesByTitle([FromQuery] string titleSearch)
        {
            try
            {
                _logger.LogInformation($"Starting search by title with term: {titleSearch}");
                _logger.LogInformation($"Request headers: {string.Join(", ", Request.Headers.Select(h => $"{h.Key}: {h.Value}"))}");
                _logger.LogInformation($"Request query string: {Request.QueryString}");
                
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    _logger.LogError("User ID is null or empty");
                    return Unauthorized();
                }

                _logger.LogInformation($"Searching notes for user {userId}");

                if (string.IsNullOrWhiteSpace(titleSearch))
                {
                    _logger.LogWarning("Empty search term provided");
                    return BadRequest(new { message = "Search term cannot be empty" });
                }

                var notes = await _context.Notes
                    .Where(n => n.UserId == userId && n.Title.ToLower().Contains(titleSearch.ToLower()))
                    .OrderByDescending(n => n.CreatedAt)
                    .Select(n => new NoteDto
                    {
                        Id = n.Id,
                        Title = n.Title,
                        Description = n.Description,
                        CreatedAt = n.CreatedAt
                    })
                    .ToListAsync();

                _logger.LogInformation($"Found {notes.Count} notes matching the search term");
                return Ok(notes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while searching notes by title");
                return StatusCode(500, new { message = "An error occurred while searching notes" });
            }
        }

        [HttpGet("search-by-date")]
        public async Task<IActionResult> SearchNotesByDate([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                if (!fromDate.HasValue && !toDate.HasValue)
                {
                    return BadRequest(new { message = "At least one date must be provided" });
                }

                if (fromDate.HasValue && toDate.HasValue && fromDate.Value > toDate.Value)
                {
                    return BadRequest(new { message = "Start date must be before end date" });
                }

                var query = _context.Notes
                    .Where(n => n.UserId == userId);

                if (fromDate.HasValue)
                {
                    query = query.Where(n => n.CreatedAt >= fromDate.Value);
                }

                if (toDate.HasValue)
                {
                    var endDate = toDate.Value.AddDays(1);
                    query = query.Where(n => n.CreatedAt < endDate);
                }

                var notes = await query
                    .OrderByDescending(n => n.CreatedAt)
                    .Select(n => new NoteDto
                    {
                        Id = n.Id,
                        Title = n.Title,
                        Description = n.Description,
                        CreatedAt = n.CreatedAt
                    })
                    .ToListAsync();

                return Ok(notes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while searching notes by date");
                return StatusCode(500, new { message = "An error occurred while searching notes" });
            }
        }
    }
} 