package com.ulms.catalog.service;

import com.ulms.catalog.dto.AuthorDto;
import com.ulms.catalog.model.Author;
import com.ulms.catalog.repository.AuthorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthorService {

    private final AuthorRepository authorRepository;

    @Transactional(readOnly = true)
    public List<AuthorDto> getAllAuthors() {
        return authorRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AuthorDto getAuthorById(Long id) {
        return authorRepository.findById(id)
                .map(this::mapToDto)
                .orElseThrow(() -> new RuntimeException("Author not found: " + id)); // Simplification: using standard exception
    }

    @Transactional
    public AuthorDto createAuthor(AuthorDto authorDto) {
        Author author = Author.builder()
                .name(authorDto.getName())
                .biography(authorDto.getBiography())
                .build();
        Author savedAuthor = authorRepository.save(author);
        return mapToDto(savedAuthor);
    }

    @Transactional
    public AuthorDto updateAuthor(Long id, AuthorDto authorDto) {
        Author author = authorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Author not found: " + id));
        author.setName(authorDto.getName());
        author.setBiography(authorDto.getBiography());
        Author updatedAuthor = authorRepository.save(author);
        return mapToDto(updatedAuthor);
    }

    private AuthorDto mapToDto(Author author) {
        return AuthorDto.builder()
                .id(author.getId())
                .name(author.getName())
                .biography(author.getBiography())
                .createdAt(author.getCreatedAt())
                .updatedAt(author.getUpdatedAt())
                .build();
    }
}
