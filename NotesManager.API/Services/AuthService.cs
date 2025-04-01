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
            _logger.LogInformation("Starting registration process");
            
            var existingUser = await _userManager.FindByEmailAsync(registerDto.Email);
            if (existingUser != null)
            {
                _logger.LogWarning($"Registration failed: Email {registerDto.Email} is already registered");
                throw new Exception("This email is already registered");
            }

            var user = new ApplicationUser
            {
                UserName = registerDto.Email,
                Email = registerDto.Email,
                FirstName = registerDto.FirstName,
                LastName = registerDto.LastName
            };

            var result = await _userManager.CreateAsync(user, registerDto.Password);
            if (!result.Succeeded)
            {
                _logger.LogError($"Registration failed: {string.Join(", ", result.Errors.Select(e => e.Description))}");
                throw new Exception($"Registration failed: {string.Join(", ", result.Errors.Select(e => e.Description))}");
            }

            _logger.LogInformation($"User registered successfully: {registerDto.Email}");
            return await GenerateAuthResponseDtoAsync(user);
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto model)
        {
            _logger.LogInformation($"Starting login for email: {model.Email}");
            
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
            {
                _logger.LogError($"Login failed: User not found with email {model.Email}");
                throw new Exception("Invalid credentials");
            }

            var isPasswordValid = await _userManager.CheckPasswordAsync(user, model.Password);
            if (!isPasswordValid)
            {
                _logger.LogError($"Login failed: Invalid password for user {model.Email}");
                throw new Exception("Invalid credentials");
            }

            _logger.LogInformation($"User logged in successfully with ID: {user.Id}");
            return await GenerateAuthResponseDtoAsync(user);
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