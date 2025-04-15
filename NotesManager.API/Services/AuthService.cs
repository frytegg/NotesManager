using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using NotesManager.API.DTOs;
using NotesManager.API.Models;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.Extensions.Logging;

namespace NotesManager.API.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterDto model);
        Task<AuthResponseDto> LoginAsync(LoginDto model);
    }

    public class AuthService : IAuthService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthService> _logger;

        public AuthService(UserManager<ApplicationUser> userManager, IConfiguration configuration, ILogger<AuthService> logger)
        {
            _userManager = userManager;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto)
        {
            try
            {
                _logger.LogInformation($"Début du processus d'enregistrement pour l'email: {registerDto.Email}");
                _logger.LogInformation($"Données d'enregistrement: FirstName={registerDto.FirstName}, LastName={registerDto.LastName}");
                
                var existingUser = await _userManager.FindByEmailAsync(registerDto.Email);
                if (existingUser != null)
                {
                    _logger.LogWarning($"Échec de l'enregistrement: L'email {registerDto.Email} est déjà enregistré");
                    throw new Exception("Cet email est déjà enregistré");
                }

                var user = new ApplicationUser
                {
                    UserName = registerDto.Email,
                    Email = registerDto.Email,
                    FirstName = registerDto.FirstName,
                    LastName = registerDto.LastName,
                    Description = string.Empty
                };

                _logger.LogInformation("Création de l'utilisateur dans la base de données...");
                var result = await _userManager.CreateAsync(user, registerDto.Password);
                
                if (!result.Succeeded)
                {
                    var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                    _logger.LogError($"Échec de l'enregistrement avec les erreurs: {errors}");
                    throw new Exception($"Échec de l'enregistrement: {errors}");
                }

                _logger.LogInformation($"Utilisateur enregistré avec succès: {registerDto.Email}");
                return await GenerateAuthResponseDtoAsync(user);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Erreur lors de l'enregistrement: {ex.Message}");
                throw;
            }
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto model)
        {
            try
            {
                _logger.LogInformation($"Tentative de connexion pour l'email: {model.Email}");
                
                // Utiliser le nom d'utilisateur normalisé
                var normalizedEmail = model.Email.ToUpper();
                var user = await _userManager.FindByEmailAsync(normalizedEmail);
                
                if (user == null)
                {
                    _logger.LogWarning($"Échec de la connexion: Utilisateur non trouvé avec l'email {model.Email}");
                    throw new Exception("Identifiants invalides");
                }

                var isPasswordValid = await _userManager.CheckPasswordAsync(user, model.Password);
                if (!isPasswordValid)
                {
                    _logger.LogWarning($"Échec de la connexion: Mot de passe invalide pour l'utilisateur {model.Email}");
                    throw new Exception("Identifiants invalides");
                }

                _logger.LogInformation($"Utilisateur connecté avec succès: {model.Email}");
                return await GenerateAuthResponseDtoAsync(user);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Erreur lors de la connexion: {ex.Message}");
                throw;
            }
        }

        private async Task<AuthResponseDto> GenerateAuthResponseDtoAsync(ApplicationUser user)
        {
            _logger.LogInformation($"Generating auth response for user ID: {user.Id}");
            var token = await GenerateJwtTokenAsync(user);
            _logger.LogInformation($"Generated token for user {user.Id}: {token}");

            return new AuthResponseDto
            {
                Token = token,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName
            };
        }

        private async Task<string> GenerateJwtTokenAsync(ApplicationUser user)
        {
            _logger.LogInformation($"Starting JWT token generation for user ID: {user.Id}");
            
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JWT:Secret"]));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.Id)
            };

            _logger.LogInformation($"Generated claims for user {user.Id}: {string.Join(", ", claims.Select(c => $"{c.Type}: {c.Value}"))}");

            var token = new JwtSecurityToken(
                issuer: _configuration["JWT:ValidIssuer"],
                audience: _configuration["JWT:ValidAudience"],
                claims: claims,
                expires: DateTime.Now.AddHours(1),
                signingCredentials: credentials
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
            _logger.LogInformation($"JWT token generated successfully for user {user.Id}");
            
            return tokenString;
        }
    }
} 